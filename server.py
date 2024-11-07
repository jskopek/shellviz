import asyncio
import atexit
import threading
import time
import struct
import json
from utils_html import parse_request, write_404, write_file, get_local_ip, print_qr
from utils_websockets import send_websocket_message, receive_websocket_message, perform_websocket_handshake

class Server:
    def __init__(self, value=None, port=5544, host="0.0.0.0"):
        self.entries = []
        self._initial_value = value # if an initial value is provided, it will be visualized once the server is started

        self.host = host
        self.port = port

        self.loop = asyncio.new_event_loop() # the event loop that is attached to the thread created for this instance; new `create_task` async methods are added to the loop
        self.http_server_task = None # keeps track of http server task that is triggered by the asyncio.create_task method so it can be cancelled on `shutdown`
        self.websocket_server_task = None # keeps track of the websocket server task that is triggered by the asyncio.create_task method so it can be cancelled on `shutdown`

        self.websocket_clients = set() # set of all connected websocket clients

        atexit.register(self.shutdown)  # Register cleanup at program exit
        self.start()


    # -- Threading methods --
    def start(self):
        self.http_server_task = self.loop.create_task(self.start_http_server()) # runs `start_server` asynchronously and stores the task object in `http_server_task` so it can be canclled on `shutdown`
        self.websocket_server_task = self.loop.create_task(self.start_websocket_server()) # runs `start_server` asynchronously and stores the task object in `http_server_task` so it can be canclled on `shutdown`
        
        threading.Thread(target=self._run_event_loop, daemon=True).start()  # Run loop in background thread; daemon=True ensures that the thread is killed when the main thread exits

    def _run_event_loop(self):
        # run initial visualization command if initial entries is provided
        if self._initial_value:
            self.visualize(self._initial_value)
            self._initial_value = None

        asyncio.set_event_loop(self.loop) # set this thread's event loop to the main event loop
        self.loop.run_forever() # keep the event loop running

    def shutdown(self):
        print("Shutting down server...")

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
        server = await asyncio.start_server(self.handle_http, self.host, self.port)  # start the tcp server on the specified host and port
        print(f'Serving on http://{get_local_ip()}:{self.port}')

        try:
            # if qrcode module is installed, output a QR code with the server's URL; fail silently if the package is not included
            print_qr(f'http://{get_local_ip()}:{self.port}')
        except ImportError:
            pass

        async with server:
            await server.serve_forever() # server will run indefinitely until the method's task is `.cancel()`ed

    async def handle_http(self, reader, writer):
        request = await parse_request(reader)
        if request.path == '/':
            await write_file(writer, 'client/public/index.html', {'entries': json.dumps(self.entries)})
        elif request.path.startswith('/static'):
            await write_file(writer, 'client/build' + request.path)
        else:
            await write_404(writer)
    # -- / HTTP server methods --

    # -- WebSocket server methods --
    async def start_websocket_server(self):
        server = await asyncio.start_server(self.handle_websocket_connection, self.host, self.port + 1)
        print(f'Serving on ws://{self.host}:{self.port + 1}')

        async with server:
            await server.serve_forever()  # server will run indefinitely until the method's task is `.cancel()`ed

    async def handle_websocket_connection(self, reader, writer):
        # Perform WebSocket handshake
        await perform_websocket_handshake(reader, writer)

        self.websocket_clients.add(writer)
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

    async def message_websocket_clients(self, entry):
        value = json.dumps(entry)
        for writer in self.websocket_clients:
            await send_websocket_message(writer, value)

    # -- / WebSocket server methods --

    def visualize(self, value, id: str = None):
        # wrap data in a dictionary with an id
        entry = {
            'id': id or str(time.time()),
            'data': value
        }

        # update content if matching id is found, otherwise append new data
        for i, item in enumerate(self.entries):
            if item['id'] == entry['id']:
                self.entries[i] = entry
                break
        else:
            self.entries.append(entry)

        # send new entry to all clients via websocket
        asyncio.run_coroutine_threadsafe(self.message_websocket_clients(entry), self.loop)


# Usage example
if __name__ == "__main__":
    # Start server instance
    s = Server()

    # while True:
    #     try:
    #         content = input("Enter content: ")
    #         s.visualize(content)
    #     except KeyboardInterrupt:
    #         break

    # i = 0
    # while True:
    #     s.visualize(f'message {i}')
    #     s2.visualize(f'another server message {i}')
    #     i += 1
    #     time.sleep(3)


    time.sleep(2)
    s.visualize('welcome to the server')
    time.sleep(2)
    s.visualize('another message')
    time.sleep(2)