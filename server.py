import socketserver
import socket
import sys
import threading
import http.server

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
        self._start_server()  # Automatically start the server in a separate thread

    def get_url(self):
        local_ip = get_local_ip()
        return f"http://{local_ip}:{self.port}"

    def send_data(self, data):
        self.content += data

    def _start_server(self):
        # Define the request handler with access to the instance content
        server_instance = self

        class CustomHandler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header("Content-type", "text/plain")
                self.end_headers()
                self.wfile.write(server_instance.content.encode())

        def serve_forever():
            # Create the socket manually and bind it
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                sock.bind(("", self.port))
                # Pass the pre-bound socket to TCPServer
                with socketserver.TCPServer(("", self.port), CustomHandler, bind_and_activate=False) as httpd:
                    httpd.socket = sock  # Assign the manually configured socket
                    httpd.server_activate()  # Activate the server manually
                    print(f"Serving on {self.get_url()}")
                    try:
                        httpd.serve_forever()
                    except KeyboardInterrupt:
                        print("\nServer is shutting down.")
                    finally:
                        httpd.server_close()  # Ensure the server is fully closed

        # Start the server in a new thread
        self.server_thread = threading.Thread(target=serve_forever)
        self.server_thread.daemon = True
        self.server_thread.start()

if __name__ == "__main__":
    port = int(sys.argv[1]) if sys.argv[1] else 5544

    # Instantiate the Server object as described
    server = Server(port)
    print(server.get_url())
    try:
        while True:
            server.send_data(input("Enter data: "))
    except KeyboardInterrupt:
        print("\nExiting main program.")
