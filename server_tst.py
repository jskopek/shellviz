import asyncio
import atexit
import threading
import time

class Server:
    def __init__(self, host="0.0.0.0", port=5544):
        self.host = host
        self.port = port

        self.loop = asyncio.new_event_loop()
        self.server_task = None

        self.data_queue = asyncio.Queue()

        atexit.register(self.shutdown)  # Register cleanup at program exit

    def start(self):
        self.server_task = self.loop.create_task(self.start_server())
        threading.Thread(target=self._run_event_loop, daemon=True).start()  # Run loop in background thread

    async def start_server(self):
        server = await asyncio.start_server(self.handle_client, self.host, self.port)
        addr = server.sockets[0].getsockname()
        print(f'Serving on {addr}')

        async with server:
            await server.serve_forever()


    def _run_event_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()


    async def handle_client(self, reader, writer):
        addr = writer.get_extra_info('peername')
        print(f"Client connected: {addr}")
        
        while True:
            data = await reader.read(100)
            if not data:
                break
            message = data.decode()
            print(f"Received {message} from {addr}")

        print(f"Client disconnected: {addr}")
        writer.close()
        await writer.wait_closed()
    async def _send_data_to_server(self, data):
        await self.data_queue.put(data)
        print(f"Data sent to server: {data}")

    def visualize(self, data):
        asyncio.run_coroutine_threadsafe(self._send_data_to_server(data), self.loop)

    def shutdown(self):
        print("Shutting down server...")
        if self.server_task:
            self.server_task.cancel()

        def _shutdown_loop():
            # Stop the event loop
            self.loop.stop()

            # Gather all tasks to ensure they are canceled
            pending_tasks = asyncio.all_tasks(loop=self.loop)
            for task in pending_tasks:
                task.cancel()

            # Run the loop until all tasks are canceled
            self.loop.run_until_complete(asyncio.gather(*pending_tasks, return_exceptions=True))

            # Finally close the loop
            self.loop.close()

        # Schedule the shutdown on the event loop's thread
        self.loop.call_soon_threadsafe(_shutdown_loop)

    def __del__(self):
        self.shutdown()  # Ensure cleanup if object is deleted

# Usage example
if __name__ == "__main__":
    # Start server instance
    s = Server()
    s.start()

    # Send data to server
    s.visualize('test')
    time.sleep(4)  # Server continues to run
    s.visualize('two')
    print("Program complete")  # Server shuts down automatically on program exit