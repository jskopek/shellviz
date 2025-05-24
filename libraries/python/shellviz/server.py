import asyncio
import atexit
import threading
import time
import json as jsonFn
from .utils_serialize import to_json_string
from typing import Optional
from .utils import append_data
from .utils_html import parse_request, write_200, write_404, write_cors_headers, write_file, write_json, BufferedStreamReader
from .utils_websockets import send_websocket_message, receive_websocket_message, perform_websocket_handshake
from .config import SHELLVIZ_PORT
import os


class ShellvizServer:
    def __init__(self, port: int = 5544):
        self.port = SHELLVIZ_PORT or port
        
        self.entries = []  # store a list of all existing entries; client will show these entries on page load
        self.pending_entries = []  # store a list of all pending entries that have yet to be sent via websocket connection
        self.is_initialized = False  # flag to track if server is fully initialized
        self.initialized_event = threading.Event()  # thread-safe event for initialization

        self.loop = asyncio.new_event_loop() # the event loop that is attached to the thread created for this instance; new `create_task` async methods are added to the loop
        self.server_task = None # keeps track of http/websocket server task that is triggered by the asyncio.create_task method so it can be cancelled on `shutdown`

        self.websocket_clients = set() # set of all connected websocket clients

        atexit.register(self.shutdown)  # Register cleanup at program exit

        # start the server if no existing server is found; if an existing server found, we will send requests to it instead
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

        self.is_initialized = True  # mark server as initialized once it's ready to accept connections
        self.initialized_event.set()  # signal that initialization is complete

        async with server:
            await server.serve_forever() # server will run indefinitely until the method's task is `.cancel()`ed


    async def handle_connection(self, reader, writer):
        # Read up to 1024 bytes to determine connection type, but do not lose them
        data = await reader.read(1024)
        if not data:
            return

        buffered_reader = BufferedStreamReader(data, reader)

        # Check if this is a WebSocket handshake request
        if data.startswith(b'GET / HTTP/1.1') and b'Upgrade: websocket' in data:
            try:
                await self.handle_websocket_connection(buffered_reader, writer)
            except (asyncio.CancelledError, GeneratorExit, BrokenPipeError, ConnectionResetError):
                pass
            except Exception as e:
                print(f"Unexpected error in handle_connection: {e}")
        else:
            try:
                await self.handle_http(buffered_reader, writer)
            except (asyncio.CancelledError, GeneratorExit, BrokenPipeError, ConnectionResetError):
                pass
            except Exception as e:
                print(f"Unexpected error in handle_http: {e}")

        # Always ensure the writer is closed
        if not writer.is_closing():
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
    # -- / Commands to initialize and handle HTTP & WebSocket connections --

    # -- HTTP sever method --
    async def handle_http(self, reader, writer):
        request = await parse_request(reader)

        # Compiled python package will have a `dist` folder in the same directory as the package; this can be overridden by setting the `SHELLVIZ_CLIENT_DIST_PATH` environment variable
        CLIENT_DIST_PATH = os.environ.get('CLIENT_DIST_PATH', os.path.join(os.path.dirname(__file__), 'client_build')) 

        # Handle OPTIONS requests for CORS preflight
        if request.method == 'OPTIONS':
            await write_cors_headers(writer)
        elif request.path == '/':
            # listen for request to root webpage
            await write_file(writer, os.path.join(CLIENT_DIST_PATH, 'index.html'))
        elif request.path == '/api/entries':
            # listen for requests to get all entries
            await write_json(writer, to_json_string(self.entries))
        elif request.path == '/api/running':
            # listen for requests to check if a server is running on the specified port
            await write_200(writer)
        elif request.path.startswith('/api/delete'):
            # listen for requests to delete an entry
            entry_id = request.path.split('/')[-1]
            self.entries = [entry for entry in self.entries if entry['id'] != entry_id]
            await write_200(writer)
        elif request.path == '/api/clear':
            self.entries = []
            self.send(value='___clear___')
            await write_200(writer)
        elif request.path == '/api/wait':
            # listen for requests to wait for all pending entries to be sent to the client via websocket
            # once all pending entries are sent, the server will respond with a 200 status code
            while self.pending_entries:
                await asyncio.sleep(0.05)  # Use asyncio.sleep instead of time.sleep
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
            # attempt to serve any file matching the request path from the dist directory
            relative_path = request.path.lstrip('/')
            file_path = os.path.join(CLIENT_DIST_PATH, relative_path)
            if os.path.isfile(file_path):
                await write_file(writer, file_path)
            else:
                await write_404(writer)
    # -- / HTTP server method --

    # -- WebSocket server methods --
    async def handle_websocket_connection(self, reader, writer):
        try:
            await perform_websocket_handshake(reader, writer)
            self.websocket_clients.add(writer)
            asyncio.run_coroutine_threadsafe(self.send_pending_entries_to_websocket_clients(), self.loop)
            try:
                while True:
                    try:
                        message = await receive_websocket_message(reader)
                        if message is None:
                            break # [WebSocket] received None, connection likely closed"
                        elif message == "":
                            continue # [WebSocket] received empty message, continuing"
                    except (asyncio.CancelledError, GeneratorExit, ConnectionResetError, BrokenPipeError):
                        break # [WebSocket] disconnect or cancellation"
                    except Exception as e:
                        break # [WebSocket] error receiving message"
            except Exception as e:
                pass # [WebSocket] error in message loop"
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
        existing_entry_index = next((i for i, item in enumerate(self.entries) if item['id'] == id), -1) if id else -1
        if existing_entry_index >= 0:
            if append:
                # if an existing entry is found and append is true, append the new data to the existing entry
                value = append_data(self.entries[existing_entry_index]['data'], value)
            self.entries[existing_entry_index]['data'] = value
            self.entries[existing_entry_index]['view'] = view

            # add to list of pending entries that should be sent the client via websocket
            entry = self.entries[existing_entry_index]

        else:
            id = id or str(time.time())
            entry = {
                'id': id,
                'data': value,
                'view': view,
            }

            if value == '___clear___':
                # don't store clear requests in the entries list; we only want to send them to the client via websocket
                pass
            else:
                # store the entry in the entries list
                self.entries.append(entry)

        # add to list of pending entries that should be sent the client via websocket and send them to the client via websocket
        self.pending_entries.append(entry)
        asyncio.run_coroutine_threadsafe(self.send_pending_entries_to_websocket_clients(), self.loop)

        if wait:
            self.wait()
    
    def clear(self):
        # if this instance is the server, clear the entries list and send a clear request to all clients via websocket
        self.entries = []
        self.send(value='___clear___')
    
    def wait(self):
        while self.pending_entries:
            time.sleep(0.01)