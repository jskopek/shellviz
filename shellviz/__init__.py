import asyncio
import atexit
import threading
import time
import json as jsonFn
from typing import Optional

from shellviz.utils import append_data
from .utils_html import parse_request, send_request, write_200, write_404, write_file, get_local_ip, print_qr
from .utils_websockets import send_websocket_message, receive_websocket_message, perform_websocket_handshake
import socket

class Shellviz:
    def __init__(self, port=5544, show_url=True):
        self.entries = []  # store a list of all existing entries; client will show these entries on page load
        self.pending_entries = []  # store a list of all pending entries that have yet to be sent via websocket connection

        self.show_url = show_url # whether to show the server's URL in the console

        self.port = port

        # check if a server is already running on the specified port
        self.existing_server_found = True if send_request('/api/running', port=port) else False

        self.loop = asyncio.new_event_loop() # the event loop that is attached to the thread created for this instance; new `create_task` async methods are added to the loop
        self.http_server_task = None # keeps track of http server task that is triggered by the asyncio.create_task method so it can be cancelled on `shutdown`
        self.websocket_server_task = None # keeps track of the websocket server task that is triggered by the asyncio.create_task method so it can be cancelled on `shutdown`

        self.websocket_clients = set() # set of all connected websocket clients

        atexit.register(self.shutdown)  # Register cleanup at program exit

        # start the server if no existing server is found; if an existing server found, we will send requests to it instead
        if not self.existing_server_found:
            self.start()


    # -- Threading methods --
    def start(self):
        self.http_server_task = self.loop.create_task(self.start_http_server()) # runs `start_server` asynchronously and stores the task object in `http_server_task` so it can be canclled on `shutdown`
        self.websocket_server_task = self.loop.create_task(self.start_websocket_server()) # runs `start_server` asynchronously and stores the task object in `http_server_task` so it can be canclled on `shutdown`
        
        threading.Thread(target=self._run_event_loop, daemon=True).start()  # Run loop in background thread; daemon=True ensures that the thread is killed when the main thread exits

    def _run_event_loop(self):
        asyncio.set_event_loop(self.loop) # set this thread's event loop to the main event loop
        self.loop.run_forever() # keep the event loop running

    def shutdown(self):
        # print("Shutting down server...")

        # shuts down the http and websocket servers
        if self.http_server_task:
            self.http_server_task.cancel()
        if self.websocket_server_task:
            self.websocket_server_task.cancel()

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

    # -- HTTP sever methods --
    async def start_http_server(self):
        server = await asyncio.start_server(self.handle_http, '0.0.0.0', self.port)  # start the tcp server on the specified host and port

        if self.show_url:
            self.show_url()
            self.show_qr_code(warn_on_import_error=False)

        async with server:
            await server.serve_forever() # server will run indefinitely until the method's task is `.cancel()`ed

    async def handle_http(self, reader, writer):
        request = await parse_request(reader)
        if request.path == '/':
            # listen for request to root webpage
            await write_file(writer, 'build/index.html', {'entries': jsonFn.dumps(self.entries)})
        elif request.path.startswith('/static'):
            # listen to requests for client js/css
            await write_file(writer, 'build' + request.path)
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
    # -- / HTTP server methods --

    # -- WebSocket server methods --
    async def start_websocket_server(self):
        server = await asyncio.start_server(self.handle_websocket_connection, '0.0.0.0', self.port + 1)

        # print(f'Serving on ws://{get_local_ip()}:{self.port + 1}')

        async with server:
            await server.serve_forever()  # server will run indefinitely until the method's task is `.cancel()`ed

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
            value = jsonFn.dumps(entry)
            for writer in self.websocket_clients:
                await send_websocket_message(writer, value)

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
        print(f'Shellviz serving on http://{get_local_ip()}:{self.port}')

    def show_qr_code(self, warn_on_import_error=True):
        try:
            # if qrcode module is installed, output a QR code with the server's URL; fail silently if the package is not included
            print_qr(f'http://{get_local_ip()}:{self.port}')
        except ImportError:
            if warn_on_import_error:
                print(f'The `qcode` package (available via `pip install qrcode`) is required to show the QR code')

    # -- Convenience methods for quickly sending data with a specific view --
    def table(self, data, id: Optional[str] = None): self.send(data, id=id, view='table')
    def log(self, data, id: Optional[str] = None): self.send([(data, time.time())], id=id or 'log', append=True, view='log')
    def json(self, data, id: Optional[str] = None): self.send(data, id=id, view='json')
    def markdown(self, data, id: Optional[str] = None): self.send(data, id=id, view='markdown')
    def progress(self, data, id: Optional[str] = None): self.send(data, id=id, view='progress')
    def pie(self, data, id: Optional[str] = None): self.send(data, id=id, view='pie')
    def number(self, data, id: Optional[str] = None): self.send(data, id=id, view='number')
    def area(self, data, id: Optional[str] = None): self.send(data, id=id, view='area')
    def bar(self, data, id: Optional[str] = None): self.send(data, id=id, view='bar')
    def card(self, data, id: Optional[str] = None): self.send(data, id=id, view='card')
