import asyncio
import atexit
import threading
import time
from utils_html import write_html, write_file, get_local_ip

class Server:
    def __init__(self, content='', host="0.0.0.0", port=5544):
        self.content = content

        self.host = host
        self.port = port

        self.loop = asyncio.new_event_loop() # the main event loop that runs async tasks; new `create_task` async methods are added to the loop
        self.server_task = None # keeps track of http server task that is triggered by the asyncio.create_task method so it can be cancelled on `shutdown`

        atexit.register(self.shutdown)  # Register cleanup at program exit
        self.start()

    def start(self):
        self.server_task = self.loop.create_task(self.start_server()) # runs `start_server` asynchronously and stores the task object in `server_task` so it can be canclled on `shutdown`
        threading.Thread(target=self._run_event_loop, daemon=True).start()  # Run loop in background thread; daemon=True ensures that the thread is killed when the main thread exits

    async def start_server(self):
        server = await asyncio.start_server(self.handle_http, self.host, self.port)  # start the tcp server on the specified host and port
        print(f'Serving on http://{get_local_ip()}:{self.port}')

        async with server:
            await server.serve_forever() # server will run indefinitely until the method's task is `.cancel()`ed

    def _run_event_loop(self):
        asyncio.set_event_loop(self.loop) # set this thread's event loop to the main event loop
        self.loop.run_forever() # keep the event loop running

    def shutdown(self):
        print("Shutting down server...")
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

    async def handle_http(self, reader, writer):
        # await write_html(writer, self.content)
        await write_file(writer, 'client/public/index.html', {'messages': self.content})

    def visualize(self, data):
        self.content += '<div>' + data + '</div>'




# Usage example
if __name__ == "__main__":
    # Start server instance
    s = Server('this works real good')
    time.sleep(3)

    # while True:
    #     content = input("Enter content: ")
    #     s.visualize(content)

    # # Send data to server
    s.visualize('second message')
    time.sleep(3)  # Server continues to run