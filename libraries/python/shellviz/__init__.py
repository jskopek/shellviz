import asyncio
import atexit
import threading
import time
import json as jsonFn
import logging
from .utils_serialize import to_json_string
from typing import Optional

from shellviz.utils import append_data
from .utils_html import parse_request, send_request, write_200, write_404, write_cors_headers, write_file, get_local_ip, print_qr
from .utils_websockets import send_websocket_message, receive_websocket_message, perform_websocket_handshake
import socket
import os

# Configure logging to silence specific warnings
logging.getLogger('asyncio').setLevel(logging.ERROR)

class Shellviz:
    def __init__(self, port=5544, show_url=True):
        self.entries = []  # store a list of all existing entries; client will show these entries on page load
        self.pending_entries = []  # store a list of all pending entries that have yet to be sent via websocket connection

        self.show_url_on_start = show_url # whether to show the server's URL in the console

        self.port = port

        # check if a server is already running on the specified port
        self.existing_server_found = True if send_request('/api/running', port=port) else False

        self.loop = asyncio.new_event_loop() # the event loop that is attached to the thread created for this instance; new `create_task` async methods are added to the loop
        self.server_task = None # keeps track of http/websocket server task that is triggered by the asyncio.create_task method so it can be cancelled on `shutdown`

        self.websocket_clients = set() # set of all connected websocket clients

        atexit.register(self.shutdown)  # Register cleanup at program exit

        # start the server if no existing server is found; if an existing server found, we will send requests to it instead
        if not self.existing_server_found:
            self.start()


    # -- Threading methods --
    def start(self):
        self.server_task = self.loop.create_task(self.start_server()) # runs `start_server` asynchronously and stores the task object in `server_task` so it can be canclled on `shutdown`
        
        threading.Thread(target=self._run_event_loop, daemon=True).start()  # Run loop in background thread; daemon=True ensures that the thread is killed when the main thread exits

    def _run_event_loop(self):
        asyncio.set_event_loop(self.loop) # set this thread's event loop to the main event loop
        self.loop.run_forever() # keep the event loop running

    def shutdown(self):
        # print("Shutting down server...")

        # shuts down the http and websocket servers
        if self.server_task:
            self.server_task.cancel()

        def _shutdown_loop():
            # Gather all tasks to ensure they are canceled
            pending_tasks = asyncio.all_tasks(loop=self.loop)
            for task in pending_tasks:
                task.cancel()

            # Schedule closing the loop after tasks are cancelled
            self.loop.call_soon_threadsafe(self.loop.stop)

        # Schedule the shutdown on the event loop's thread
        self.loop.call_soon_threadsafe(_shutdown_loop)

    def __del__(self):
        self.shutdown()  # Ensure cleanup if object is deleted
    # -- / threading methods --

    # -- Commands to initialize and handle HTTP & WebSocket connections --
    async def start_server(self):
        server = await asyncio.start_server(self.handle_connection, '0.0.0.0', self.port)  # start the tcp server on the specified host and port

        if self.show_url_on_start:
            self.show_url()
            self.show_qr_code(warn_on_import_error=False)

        # print(f'Server started on port {self.port}')
        # print(f'Serving on http://{get_local_ip()}:{self.port}')
        # print(f'WebSocket available on ws://{get_local_ip()}:{self.port}')

        async with server:
            await server.serve_forever() # server will run indefinitely until the method's task is `.cancel()`ed

    async def handle_connection(self, reader, writer):
        # Peek at the first few bytes to determine if this is a WebSocket connection
        data = await reader.read(1024)
        if not data:
            return

        # Create a new reader that includes the data we already read
        new_reader = asyncio.StreamReader()
        new_reader.feed_data(data)

        # Check if this is a WebSocket handshake request
        if data.startswith(b'GET / HTTP/1.1') and b'Upgrade: websocket' in data:
            # This is a WebSocket connection
            # Don't call feed_eof() for WebSocket because we need to keep reading more data
            # after the handshake (like messages from the client)
            try:
                await self.handle_websocket_connection(new_reader, writer)
            except BrokenPipeError:
                # This is a normal occurrence when the client disconnects; ignore it
                pass
        else:
            # This is an HTTP connection
            # Call feed_eof() for HTTP because we've received the complete request
            # and don't expect any more data from the client
            new_reader.feed_eof()
            await self.handle_http(new_reader, writer)
    # -- / Commands to initialize and handle HTTP & WebSocket connections --

    # -- HTTP sever method --
    async def handle_http(self, reader, writer):
        request = await parse_request(reader)

        # Compiled python package will have a `dist` folder in the same directory as the package; this can be overridden by setting the `SHELLVIZ_CLIENT_DIST_PATH` environment variable
        CLIENT_DIST_PATH = os.environ.get('CLIENT_DIST_PATH', os.path.join(os.path.dirname(__file__), 'dist')) 

        # Handle OPTIONS requests for CORS preflight
        if request.method == 'OPTIONS':
            await write_cors_headers(writer)
        elif request.path == '/':
            # listen for request to root webpage
            await write_file(writer, os.path.join(CLIENT_DIST_PATH, 'index.html'), {'entries': to_json_string(self.entries)})
        elif request.path.startswith('/static'):
            # listen to requests for client js/css
            relative_path = request.path.lstrip('/') # strip the leading `/` from the path so it can be joined with the `CLIENT_DIST_PATH`
            await write_file(writer, os.path.join(CLIENT_DIST_PATH, relative_path))
        elif request.path == '/api/running':
            # listen for requests to check if a server is running on the specified port
            await write_200(writer)
        elif request.path == '/api/send' and request.method == 'POST':
            # listen to requests to add new content
            entry = jsonFn.loads(request.body)

            if entry.get('data'):
                self.send(entry['data'], id=entry.get('id'), append=entry.get('append'), view=entry.get('view'))
                await write_200(writer)
            else:
                await write_404(writer)
        else:
            await write_404(writer)
    # -- / HTTP server method --

    # -- WebSocket server methods --
    async def handle_websocket_connection(self, reader, writer):
        # Perform WebSocket handshake
        await perform_websocket_handshake(reader, writer)

        self.websocket_clients.add(writer)

        # send any pending updates to clients via websocket
        asyncio.run_coroutine_threadsafe(self.send_pending_entries_to_websocket_clients(), self.loop)

        try:
            while True:
                message = await receive_websocket_message(reader)
                if message is None:
                    break  # Connection was closed
                # Process the message as needed (e.g., log, process, respond, etc.)
        except Exception as e:
            print(f"WebSocket error: {e}")
        finally:
            # Ensure the client is removed from the set even if another exception occurs
            self.websocket_clients.discard(writer)
            writer.close()
            await writer.wait_closed()

    async def send_pending_entries_to_websocket_clients(self):
        if not self.websocket_clients:
            return # No clients to send to

        while self.pending_entries:
            entry = self.pending_entries.pop(0)
            value = to_json_string(entry)
            disconnected_clients = set()
            
            for writer in self.websocket_clients:
                try:
                    await send_websocket_message(writer, value)
                except (ConnectionResetError, BrokenPipeError, ConnectionError):
                    # Client disconnected, mark for removal
                    disconnected_clients.add(writer)
                except Exception as e:
                    # Log other errors but don't crash
                    print(f"Error sending WebSocket message: {e}")
                    disconnected_clients.add(writer)
            
            # Remove disconnected clients
            self.websocket_clients -= disconnected_clients
            for writer in disconnected_clients:
                try:
                    writer.close()
                    await writer.wait_closed()
                except Exception:
                    pass

    # -- / WebSocket server methods --

    def send(self, value, id: str = None, view: Optional[str] = None, append: bool = False, wait: bool = False):
        id = id or str(time.time())
        existing_entry_index = next((i for i, item in enumerate(self.entries) if item['id'] == id), None)

        if existing_entry_index is not None and append:
            value = append_data(self.entries[existing_entry_index]['data'], value)
        
        # wrap data in a dictionary with an id
        entry = {
            'id': id,
            'data': value,
            'view': view
        }

        # if an existing server is found, send the data to that server via api
        if self.existing_server_found:
            entry['append'] = append # add the append status to the entry
            send_request('/api/send', entry, self.port, 'POST')
            return

        # update content if matching id is found, otherwise append new data
        for i, item in enumerate(self.entries):
            if item['id'] == entry['id']:
                self.entries[i] = entry
                break
        else:
            self.entries.append(entry)

        # add to list of pending entries that should be sent the client via websocket
        self.pending_entries.append(entry)

        # send pending entries to all clients via websocket
        asyncio.run_coroutine_threadsafe(self.send_pending_entries_to_websocket_clients(), self.loop)

        if wait:
            self.wait()
    
    def clear(self):
        self.send(value='___clear___')
        self.entries = []
    
    def wait(self):
        while self.pending_entries:
            time.sleep(0.01)
        
    def show_url(self):
        print(f'Shellviz running on http://{get_local_ip()}:{self.port}')

    def show_qr_code(self, warn_on_import_error=True):
        try:
            # if qrcode module is installed, output a QR code with the server's URL; fail silently if the package is not included
            print_qr(f'http://{get_local_ip()}:{self.port}')
        except ImportError:
            if warn_on_import_error:
                print(f'The `qcode` package (available via `pip install qrcode`) is required to show the QR code')

    # -- Convenience methods for quickly sending data with a specific view --
    def table(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='table', append=append)
    def log(self, data, id: Optional[str] = None, append: bool = True): self.send([(data, time.time())], id=id or 'log', view='log', append=append)
    def json(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='json', append=append)
    def markdown(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='markdown', append=append)
    def progress(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='progress', append=append)
    def pie(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='pie', append=append)
    def number(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='number', append=append)
    def area(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='area', append=append)
    def bar(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='bar', append=append)
    def card(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='card', append=append)
    def location(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='location', append=append)
    def raw(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='raw', append=append)
    


# Global instance of Shellviz
_global_shellviz_instance = None
def _global_shellviz():
    global _global_shellviz_instance
    if not _global_shellviz_instance:
        print("Shellviz: No instance found. Creating new instance.")
        _global_shellviz_instance = Shellviz()
    return _global_shellviz_instance

# Convenience methods for quickly interacting with a global shellviz instance
def send(data, id: Optional[str] = None): _global_shellviz().send(data, id=id, view='text')
def clear(): _global_shellviz().clear()
def show_url(): _global_shellviz().show_url()
def show_qr_code(): _global_shellviz().show_qr_code()
def wait(): _global_shellviz().wait()

def log(data, id: Optional[str] = None, append: bool = True): _global_shellviz().log(data, id=id)
def table(data, id: Optional[str] = None, append: bool = False): _global_shellviz().table(data, id=id)
def json(data, id: Optional[str] = None, append: bool = False): _global_shellviz().json(data, id=id)
def markdown(data, id: Optional[str] = None, append: bool = False): _global_shellviz().markdown(data, id=id)
def progress(data, id: Optional[str] = None, append: bool = False): _global_shellviz().progress(data, id=id)
def pie(data, id: Optional[str] = None, append: bool = False): _global_shellviz().pie(data, id=id)
def number(data, id: Optional[str] = None, append: bool = False): _global_shellviz().number(data, id=id)
def area(data, id: Optional[str] = None, append: bool = False): _global_shellviz().area(data, id=id)
def bar(data, id: Optional[str] = None, append: bool = False): _global_shellviz().bar(data, id=id)
def card(data, id: Optional[str] = None, append: bool = False): _global_shellviz().card(data, id=id)
def location(data, id: Optional[str] = None, append: bool = False): _global_shellviz().location(data, id=id)
def raw(data, id: Optional[str] = None, append: bool = False): _global_shellviz().raw(data, id=id)