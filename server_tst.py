import asyncio
import atexit
import threading
import time
from utils_html import write_html, write_file, get_local_ip

class Server:
    def __init__(self, content=None, host="0.0.0.0", port=5544):
        self.content = ''

        self.host = host
        self.port = port

        self.loop = asyncio.new_event_loop()
        self.server_task = None

        atexit.register(self.shutdown)  # Register cleanup at program exit
        self.start()

    def start(self):
        self.server_task = self.loop.create_task(self.start_server())
        threading.Thread(target=self._run_event_loop, daemon=True).start()  # Run loop in background thread

    async def start_server(self):
        server = await asyncio.start_server(self.handle_http, self.host, self.port)
        print(f'Serving on http://{get_local_ip()}:{self.port}')

        async with server:
            await server.serve_forever()

    def _run_event_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    async def handle_http(self, reader, writer):
        # await write_html(writer, self.content)
        await write_file(writer, 'client/public/index.html', {'messages': self.content})

    def visualize(self, data):
        self.content += '<div>' + data + '</div>'

    def shutdown(self):
        print("Shutting down server...")
        if self.server_task:
            self.server_task.cancel()

        def _shutdown_loop():
            # # Stop the event loop
            # self.loop.stop()

            # Gather all tasks to ensure they are canceled
            pending_tasks = asyncio.all_tasks(loop=self.loop)
            for task in pending_tasks:
                task.cancel()

            # Schedule closing the loop after tasks are cancelled
            self.loop.call_soon_threadsafe(self.loop.stop)

            # # Run the loop until all tasks are canceled
            # self.loop.run_until_complete(asyncio.gather(*pending_tasks, return_exceptions=True))

            # # Finally close the loop
            # self.loop.close()

        # Schedule the shutdown on the event loop's thread
        self.loop.call_soon_threadsafe(_shutdown_loop)

    def __del__(self):
        self.shutdown()  # Ensure cleanup if object is deleted

# Usage example
if __name__ == "__main__":
    # Start server instance
    s = Server(['this works real good'])
    # s.start()
    # s.visualize('hello world')
    # time.sleep(1)
    # s.visualize('hello world')
    time.sleep(3)

    # while True:
    #     content = input("Enter content: ")
    #     s.visualize(content)

    # # Send data to server
    # s.visualize('test')
    # time.sleep(1)  # Server continues to run
    # s.visualize('test')
    # time.sleep(1)  # Server continues to run
    # s.visualize('test')
    # time.sleep(1)  # Server continues to run
    # s.visualize('test')
    # time.sleep(4)  # Server continues to run
    # s.visualize('two')
    # print("Program complete")  # Server shuts down automatically on program exit