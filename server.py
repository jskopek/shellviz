import socketserver
import socket
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

    def get_url(self):
        local_ip = get_local_ip()
        return f"http://{local_ip}:{self.port}"

    def send_data(self, data):
        self.content += data

def start_server(PORT):
    server_instance = Server(PORT)

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
            sock.bind(("", PORT))
            # Pass the pre-bound socket to TCPServer
            with socketserver.TCPServer(("", PORT), CustomHandler, bind_and_activate=False) as httpd:
                httpd.socket = sock  # Assign the manually configured socket
                httpd.server_activate()  # Activate the server manually
                print(f"Serving on {server_instance.get_url()}")
                try:
                    httpd.serve_forever()
                except KeyboardInterrupt:
                    print("\nServer is shutting down.")
                finally:
                    httpd.server_close()  # Ensure the server is fully closed

    server_thread = threading.Thread(target=serve_forever)
    server_thread.daemon = True
    server_thread.start()

    return server_instance

if __name__ == "__main__":
    server = start_server(5544)
    print(server.get_url())
    try:
        while True:
            server.send_data(input("Enter data: "))
    except KeyboardInterrupt:
        print("\nExiting main program.")
