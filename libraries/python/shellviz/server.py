import asyncio
import threading
import atexit
from .utils.html import get_local_ip, print_qr

import asyncio
import atexit
import threading
import time
import os
import json as jsonFn
from typing import Optional
from .utils.serialize import to_json_string, to_json_safe
from .utils.general import append_data, get_stack_trace
from .utils.html import (
    parse_request, write_200, write_404, write_cors_headers, write_file,
    get_local_ip, print_qr, write_json
)
from .utils.websockets import (
    send_websocket_message, receive_websocket_message, perform_websocket_handshake
)

class ShellvizServer:
    def __init__(self, port=5544, show_url=True):
        self.entries = []
        self.pending_entries = []
        self.show_url_on_start = show_url
        self.port = port
        self.loop = asyncio.new_event_loop()
        self.server_task = None
        self.websocket_clients = set()
        atexit.register(self.shutdown)

    def start(self):
        self.server_task = self.loop.create_task(self.start_server())
        threading.Thread(target=self._run_event_loop, daemon=True).start()

    def _run_event_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    def shutdown(self):
        if self.server_task:
            self.server_task.cancel()
        def _shutdown_loop():
            pending_tasks = asyncio.all_tasks(loop=self.loop)
            for task in pending_tasks:
                task.cancel()
            self.loop.call_soon_threadsafe(self.loop.stop)
        self.loop.call_soon_threadsafe(_shutdown_loop)

    def __del__(self):
        self.shutdown()

    async def start_server(self):
        server = await asyncio.start_server(self.handle_connection, '0.0.0.0', self.port)
        if self.show_url_on_start:
            self.show_url()
            self.show_qr_code(warn_on_import_error=False)
        async with server:
            await server.serve_forever()

    async def handle_connection(self, reader, writer):
        data = await reader.read(1024)
        if not data:
            return
        new_reader = asyncio.StreamReader()
        new_reader.feed_data(data)
        if data.startswith(b'GET / HTTP/1.1') and b'Upgrade: websocket' in data:
            try:
                await self.handle_websocket_connection(new_reader, writer)
            except (asyncio.CancelledError, GeneratorExit, BrokenPipeError, ConnectionResetError):
                pass
            except Exception as e:
                print(f"Unexpected error in handle_connection: {e}")
        else:
            new_reader.feed_eof()
            try:
                await self.handle_http(new_reader, writer)
            except (asyncio.CancelledError, GeneratorExit, BrokenPipeError, ConnectionResetError):
                pass
            except Exception as e:
                print(f"Unexpected error in handle_http: {e}")
        if not writer.is_closing():
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass

    async def handle_http(self, reader, writer):
        request = await parse_request(reader)
        CLIENT_DIST_PATH = os.environ.get('CLIENT_DIST_PATH', os.path.join(os.path.dirname(__file__), 'client_build'))
        if request.method == 'OPTIONS':
            await write_cors_headers(writer)
        elif request.path == '/':
            await write_file(writer, os.path.join(CLIENT_DIST_PATH, 'index.html'))
        elif request.path == '/api/entries':
            await write_json(writer, to_json_string(self.entries))
        elif request.path == '/api/running':
            await write_200(writer)
        elif request.path.startswith('/api/delete'):
            entry_id = request.path.split('/')[-1]
            self.entries = [entry for entry in self.entries if entry['id'] != entry_id]
            await write_200(writer)
        elif request.path == '/api/clear':
            self.entries = []
            self.send(value='___clear___')
            await write_200(writer)
        elif request.path == '/api/send' and request.method == 'POST':
            entry = jsonFn.loads(request.body)
            if entry.get('data'):
                self.send(entry['data'], id=entry.get('id'), append=entry.get('append'), view=entry.get('view'))
                await write_200(writer)
            else:
                await write_404(writer)
        else:
            relative_path = request.path.lstrip('/')
            file_path = os.path.join(CLIENT_DIST_PATH, relative_path)
            if os.path.isfile(file_path):
                await write_file(writer, file_path)
            else:
                await write_404(writer)

    async def handle_websocket_connection(self, reader, writer):
        try:
            await perform_websocket_handshake(reader, writer)
            self.websocket_clients.add(writer)
            asyncio.run_coroutine_threadsafe(self.send_pending_entries_to_websocket_clients(), self.loop)
            try:
                while True:
                    try:
                        message = await receive_websocket_message(reader)
                    except (asyncio.CancelledError, GeneratorExit, ConnectionResetError, BrokenPipeError):
                        break
                    if message is None:
                        break
            except (asyncio.CancelledError, GeneratorExit, ConnectionResetError, BrokenPipeError):
                pass
            except Exception as e:
                print(f"WebSocket error: {e}")
        finally:
            self.websocket_clients.discard(writer)
            if not writer.is_closing():
                writer.close()
                try:
                    await writer.wait_closed()
                except Exception:
                    pass

    async def send_pending_entries_to_websocket_clients(self):
        if not self.websocket_clients:
            return
        while self.pending_entries:
            entry = self.pending_entries.pop(0)
            value = to_json_string(entry)
            disconnected_clients = set()
            for writer in self.websocket_clients:
                try:
                    await send_websocket_message(writer, value)
                except (ConnectionResetError, BrokenPipeError, ConnectionError):
                    disconnected_clients.add(writer)
                except Exception as e:
                    print(f"Error sending WebSocket message: {e}")
                    disconnected_clients.add(writer)
            self.websocket_clients -= disconnected_clients
            for writer in disconnected_clients:
                try:
                    writer.close()
                    await writer.wait_closed()
                except Exception:
                    pass

    def send(self, value, id: str = None, view: Optional[str] = None, append: bool = False, wait: bool = False):
        existing_entry_index = next((i for i, item in enumerate(self.entries) if item['id'] == id), -1) if id else -1
        if existing_entry_index >= 0:
            if append:
                value = append_data(self.entries[existing_entry_index]['data'], value)
            self.entries[existing_entry_index]['data'] = value
            self.entries[existing_entry_index]['view'] = view
            entry = self.entries[existing_entry_index]
        else:
            id = id or str(time.time())
            entry = {
                'id': id,
                'data': value,
                'view': view,
            }
            if value != '___clear___':
                self.entries.append(entry)
        self.pending_entries.append(entry)
        asyncio.run_coroutine_threadsafe(self.send_pending_entries_to_websocket_clients(), self.loop)
        if wait:
            self.wait()

    def clear(self):
        self.entries = []
        self.send(value='___clear___')

    def wait(self):
        while self.pending_entries:
            time.sleep(0.01)

    def show_url(self):
        print(f'Shellviz running on http://localhost:{self.port}')

    def show_qr_code(self, warn_on_import_error=True):
        try:
            print_qr(f'http://{get_local_ip()}:{self.port}')
        except ImportError:
            if warn_on_import_error:
                print(f'The `qcode` package (available via `pip install qrcode`) is required to show the QR code')