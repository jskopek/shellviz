import asyncio
import socket
import threading
from urllib.parse import urlparse

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.254.254.254', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

class Server:
    def __init__(self, port):
        self.port = port
        self.content = ""
        self.websocket_clients = set()

        # Start the asyncio event loop in a new thread
        self.loop = asyncio.new_event_loop()
        self.server_thread = threading.Thread(target=self._start_servers)
        self.server_thread.start()

    def get_url(self):
        local_ip = get_local_ip()
        return f"http://{local_ip}:{self.port}"

    def get_websocket_url(self):
        local_ip = get_local_ip()
        return f"ws://{local_ip}:{self.port + 1}"  # WebSocket server on a different port

    def send_data(self, data):
        # Schedule send data in the event loop
        self.content += data
        asyncio.run_coroutine_threadsafe(self._notify_clients(data), self.loop)

    def _start_servers(self):
        asyncio.set_event_loop(self.loop)
        # Run servers concurrently in the event loop
        self.loop.run_until_complete(self.start_servers())
        self.loop.run_forever()

    async def start_servers(self):
        # Start HTTP server
        await asyncio.start_server(self.handle_http, '0.0.0.0', self.port)
        print(f"Serving HTTP on {self.get_url()}")

        # Start WebSocket server
        websocket_server = await asyncio.start_server(self.handle_websocket, '0.0.0.0', self.port + 1)
        print(f"Serving WebSocket on {self.get_websocket_url()}")

    async def handle_http(self, reader, writer):
        # Simple HTTP response with content
        request = await reader.read(1024)
        request_line = request.decode().splitlines()[0]
        method, path, _ = request_line.split()
        
        if method == 'GET' and path == '/':
            response = (
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: text/plain\r\n"
                f"Content-Length: {len(self.content)}\r\n"
                "\r\n" +
                self.content
            )
        else:
            response = "HTTP/1.1 404 Not Found\r\n\r\n"

        writer.write(response.encode())
        await writer.drain()
        writer.close()
        await writer.wait_closed()

    async def handle_websocket(self, reader, writer):
        # WebSocket handshake (simplified)
        request = await reader.read(1024)
        headers = request.decode().splitlines()
        if any(h.startswith("Sec-WebSocket-Key:") for h in headers):
            response = (
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                "\r\n"
            )
            writer.write(response.encode())
            await writer.drain()
            
            # Add to clients
            self.websocket_clients.add(writer)
            print("WebSocket client connected")
            
            try:
                while not writer.is_closing():
                    await asyncio.sleep(10)  # Keep connection open
            finally:
                self.websocket_clients.remove(writer)
                print("WebSocket client disconnected")
        else:
            writer.close()
            await writer.wait_closed()

    async def _notify_clients(self, message):
        if self.websocket_clients:
            message_data = message.encode()
            for client in list(self.websocket_clients):
                try:
                    client.write(message_data)
                    await client.drain()
                except (asyncio.IncompleteReadError, ConnectionResetError):
                    self.websocket_clients.remove(client)

if __name__ == "__main__":
    server = Server(5544)
    print("Server started. Use `server.send_data('hello world')` to send data.")

    try:
        while True:
            data = input("Enter data: ")
            server.send_data(data)
    except KeyboardInterrupt:
        print("\nExiting main program.")
