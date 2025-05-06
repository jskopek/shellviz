from asyncio import StreamReader, StreamWriter
from dataclasses import dataclass
import json
import mimetypes
import os
import socket
from string import Template
from typing import Optional, Union


def get_local_ip():
    """
    Returns the local IP address of the machine.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.254.254.254', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP


@dataclass
class HttpRequest:
    method: str = ""
    path: str = ""
    body: Optional[str] = None


async def parse_request(reader: StreamReader) -> HttpRequest:
    """
    Returns an HttpRequest instance with data from the provided StreamReader instance initiated from an `asyncio.start_server` request
    """
    request = await reader.read(1024)
    headers, _, body = request.decode().partition("\r\n\r\n")
    request_line = headers.splitlines()[0]
    method, path, _ = request_line.split()
    return HttpRequest(method, path, body if body else None)


async def write_html(writer: StreamWriter, html: str) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a response with the provided `html` content
    e.g.

    server = await asyncio.start_server(self.handle_http, self.host, self.port)
    async def handle_http(self, reader, writer):
        await write_html(writer, 'hello world')
    """

    response = (
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: text/html\r\n"
        f"Content-Length: {len(html)}\r\n"
        "\r\n" +
        html
    ).encode()

    writer.write(response)
    await writer.drain()
    writer.close()
    await writer.wait_closed()

async def write_response(writer: StreamWriter, status_code: int, status_message: str) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a response with the provided status code and message
    """
    response = f"HTTP/1.1 {status_code} {status_message}\r\n\r\n".encode()
    writer.write(response)
    await writer.drain()
    writer.close()
    await writer.wait_closed()

async def write_404(writer: StreamWriter) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a 404 response
    """
    await write_response(writer, 404, "Not Found")

async def write_200(writer: StreamWriter) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a 200 response
    """
    await write_response(writer, 200, "OK")


async def write_file(writer: StreamWriter, file_path: str, template_context: Optional[dict] = None) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a response with the content of the file at `file_path`
    Accepts an optional `template_context` dictionary to replace {placeholders} in the file content

    e.g.
        server = await asyncio.start_server(self.handle_http, self.host, self.port)
        async def handle_http(self, reader, writer):
            write_file(writer, 'index.html')
    """


    # Get the package directory
    package_dir = os.path.dirname(__file__)  # This assumes the file is within the package directory

    # Construct the absolute path to the file
    file_path = os.path.join(package_dir, file_path)

    if not os.path.isfile(file_path):
        return await write_404(writer)

    content_type, _ = mimetypes.guess_type(file_path)
    content_type = content_type or "application/octet-stream"
    with open(file_path, "r") as f:
        file_content = f.read()

    if template_context:
        template = Template(file_content)
        file_content = template.substitute(**template_context)

    response = (
        f"HTTP/1.1 200 OK\r\n"
        f"Content-Type: {content_type}\r\n"
        f"Content-Length: {len(file_content)}\r\n"
        "\r\n" + file_content
    ).encode()

    writer.write(response)
    writer.close()

# def render_simple_html_template(template_path: str, **kwargs) -> str:
#     """
#     Renders a simple HTML template with placeholders replaced by the provided keyword arguments.
#     e.g. 
#     template.html: <h1>{title}</h1><p>{content}</p>
#     render_simple_html_template('template.html', title='Hello', content='World')
#     """
#     with open(template_path, "r") as f:
#         html_content = f.read()
#     return html_content.format(**kwargs)


def print_qr(url):
    """
    Generates and prints a QR code for the provided `url` in the terminal
    Requires the `qrcode` package to be installed; will raise an ImportError if not available
    """
    import qrcode

    # Step 1: Generate the QR code data
    qr = qrcode.QRCode(border=1)
    qr.add_data(url)
    qr.make(fit=True)

    # Step 2: Convert the QR code matrix into ASCII for terminal display
    qr_matrix = qr.get_matrix()
    for row in qr_matrix:
        line = ''.join(['██' if cell else '  ' for cell in row])
        print(line)



def send_request(path: str, body: Optional[Union[str, dict]] = None, port: Optional[int] = 5544, method: Optional[str] = 'GET', ip_address: Optional[str] = '127.0.0.1') -> Union[str, bool]:
    """
    Sends an HTTP request to the local server and returns the response
    If a response is received, returns a decoded value of that response. If an error is raised, returns False

    :param path: The path to send the request to
    :param body: The body of the request; if a dict is provided, it will be converted to a JSON string
    :param port: The port to send the request to; default to 5544
    :param method: The HTTP method to use; default to GET
    :param ip_address: The IP address to send the request to; default to 127.0.0.1

    Example:
        send_request('/path', {'key': 'value'}, port=8080, method='POST')
    """
    try:
        with socket.create_connection((ip_address, port), timeout=1) as sock:
            headers = [
                f'{method} {path} HTTP/1.1',
                f'Host: {ip_address}'
            ]
            if body:
                if isinstance(body, dict):
                    body = json.dumps(body)
                    headers.append('Content-Type: application/json')
                headers.append(f'Content-Length: {len(body)}')
                request = '\r\n'.join(headers) + '\r\n\r\n' + body
            else:
                request = '\r\n'.join(headers) + '\r\n\r\n'
            sock.sendall(request.encode())
            response = sock.recv(1024)
            return response.decode()
    except Exception as e:
        return False