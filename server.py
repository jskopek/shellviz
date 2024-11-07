import asyncio
import socket
import threading
import websockets

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
        
        # Start the asyncio event loop in a new background thread
        self.loop = asyncio.new_event_loop()
        self.server_thread = threading.Thread(target=self._start_event_loop)
        self.server_thread.start()

    def _start_event_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self.start_servers())
        self.loop.run_forever()

    def get_url(self):
        local_ip = get_local_ip()
        return f"http://{local_ip}:{self.port}"

    def get_websocket_url(self):
        local_ip = get_local_ip()
        return f"ws://{local_ip}:{self.port + 1}"  # WebSocket on a different port

    def send_data(self, data):
        # Schedule send_data in the event loop
        self.content += data
        asyncio.run_coroutine_threadsafe(self._notify_clients(data), self.loop)

    async def start_servers(self):
        # Start HTTP server
        await asyncio.start_server(self.handle_http, '0.0.0.0', self.port)
        print(f"Serving HTTP on {self.get_url()}")

        # Start WebSocket server
        websocket_server = await websockets.serve(self.handle_websocket, '0.0.0.0', self.port + 1)
        print(f"Serving WebSocket on {self.get_websocket_url()}")

        # Keep the WebSocket server running
        await websocket_server.wait_closed()

    async def handle_http(self, reader, writer):
        # Parse request to handle HTML and JavaScript files
        request = await reader.read(1024)
        request_line = request.decode().splitlines()[0]
        method, path, _ = request_line.split()

        if method == 'GET' and path == '/':
            # Serve the HTML page with the JavaScript <script> tag
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>WebSocket Client</title>
            </head>
            <body>
                <h1>WebSocket Updates</h1>
                <div id="messages">
                    {''.join(f'<div>{line}</div>' for line in self.content.splitlines())}
                </div>
                
                <script src="/script.js"></script>
            </body>
            </html>
            """
            response = (
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: text/html\r\n"
                f"Content-Length: {len(html_content)}\r\n"
                "\r\n" +
                html_content
            )
        elif method == 'GET' and path == '/script.js':
            # Serve the JavaScript file
            try:
                with open("script.js", "r") as f:
                    js_content = f.read()
                response = (
                    "HTTP/1.1 200 OK\r\n"
                    "Content-Type: application/javascript\r\n"
                    f"Content-Length: {len(js_content)}\r\n"
                    "\r\n" +
                    js_content
                )
            except FileNotFoundError:
                response = "HTTP/1.1 404 Not Found\r\n\r\n"
        else:
            # 404 Not Found for any other paths
            response = "HTTP/1.1 404 Not Found\r\n\r\n"

        writer.write(response.encode())
        await writer.drain()
        writer.close()
        await writer.wait_closed()

    async def handle_websocket(self, websocket, path):
        # Register the client and keep connection open to receive and send messages
        self.websocket_clients.add(websocket)
        print("WebSocket client connected")

        try:
            async for message in websocket:
                print(f"Received message from client: {message}")
                # Here, echo the message back to the client or handle it differently
                await websocket.send(f"Server received: {message}")
        except websockets.ConnectionClosed:
            print("WebSocket client disconnected")
        finally:
            # Unregister the client on disconnect
            self.websocket_clients.remove(websocket)

    async def _notify_clients(self, message):
        # Send a message to all connected WebSocket clients
        if self.websocket_clients:
            await asyncio.gather(*(client.send(message) for client in self.websocket_clients if client.open))

if __name__ == "__main__":
    server = Server(5544)
    print("Server started. Use `server.send_data('hello world')` to send data.")

    try:
        while True:
            data = input("Enter data: ")
            server.send_data(data)
    except KeyboardInterrupt:
        print("\nExiting main program.")
