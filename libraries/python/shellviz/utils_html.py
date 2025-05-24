from asyncio import StreamReader, StreamWriter, IncompleteReadError
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
    Robustly parse an HTTP request from the provided StreamReader.
    Reads headers fully, determines Content-Length, and reads the correct body size.
    Returns an HttpRequest instance.
    """
    headers_bytes = b''
    while True:
        chunk = await reader.readuntil(b'\n')
        headers_bytes += chunk
        if b'\r\n\r\n' in headers_bytes:
            break
        # Protect against malicious clients sending headers forever
        if len(headers_bytes) > 32 * 1024:
            raise ValueError('HTTP headers too large')
    headers_str, _, rest = headers_bytes.partition(b'\r\n\r\n')
    headers_text = headers_str.decode(errors='replace')
    header_lines = headers_text.split('\r\n')
    if not header_lines or len(header_lines[0].split()) < 2:
        raise ValueError('Malformed HTTP request line')
    request_line = header_lines[0]
    method, path, *_ = request_line.split()
    # Parse headers
    headers = {}
    for line in header_lines[1:]:
        if not line.strip():
            continue
        if ':' in line:
            k, v = line.split(':', 1)
            headers[k.strip().lower()] = v.strip()
    content_length = int(headers.get('content-length', '0'))
    # The remainder after \r\n\r\n may contain part/all of the body
    body_bytes = rest
    to_read = content_length - len(body_bytes)
    if to_read > 0:
        more = await reader.readexactly(to_read)
        body_bytes += more
    body = body_bytes.decode(errors='replace') if content_length > 0 else None
    return HttpRequest(method=method, path=path, body=body)



async def write_response(writer: StreamWriter, status_code: int=200, status_message: str='OK', content_type: str=None, content: str=None) -> None:
    """
    Takes a StreamWriter instance initiated from an `asyncio.start_server` request and returns a response with the provided status code and message.
    Supports both string and bytes content. Always adds CORS headers.
    """
    # Prepare content as bytes
    if content is None:
        content_bytes = b""
    elif isinstance(content, str):
        content_bytes = content.encode("utf-8")
    else:
        content_bytes = content  # assume bytes

    response = (
        f"HTTP/1.1 {status_code} {status_message}\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
    )
    if content_type:
        response += f"Content-Type: {content_type}\r\n"
    response += f"Content-Length: {len(content_bytes)}\r\n"
    response += "Connection: close\r\n"
    response += "\r\n"

    writer.write(response.encode("utf-8") + content_bytes)
    await writer.drain()
    writer.close()
    await writer.wait_closed()

async def write_html(writer: StreamWriter, html: str) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a response with the provided `html` content
    e.g.

    server = await asyncio.start_server(self.handle_http, self.host, self.port)
    async def handle_http(self, reader, writer):
        await write_html(writer, 'hello world')
    """

    await write_response(writer,content_type='text/html', content=html)

async def write_404(writer: StreamWriter) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a 404 response
    """
    await write_response(writer, 404, "Not Found")

async def write_200(writer: StreamWriter) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a 200 response
    """
    await write_response(writer)

async def write_json(writer: StreamWriter, json_data: str) -> None:
    """
    Takes a StreamWriter instance initiated from an `asyncio.start_server` request and returns a JSON response
    with proper content type and formatting.
    
    Args:
        writer: The StreamWriter instance
        json_data: The JSON string to send in the response
    """
    await write_response(writer, content_type='application/json', content=json_data)

async def write_cors_headers(writer: StreamWriter) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a response with the CORS headers
    This enables the client to make cross-origin requests (e.g. via the browser plugin) to the server
    """
    await write_response(writer, 200, "OK")

async def write_file(writer: StreamWriter, file_path: str) -> None:
    """
    Takes a StreamWriter instance initiated from an `asyncio.start_server` request and returns a response with the content of the file at `file_path`.
    `file_path` is an absolute path to the file.

    e.g.
        server = await asyncio.start_server(self.handle_http, self.host, self.port)
        async def handle_http(self, reader, writer):
            write_file(writer, '/tmp/index.html')
    """

    if not os.path.isfile(file_path):
        return await write_404(writer)

    content_type, _ = mimetypes.guess_type(file_path)
    content_type = content_type or "application/octet-stream"
    with open(file_path, "rb") as f:
        file_content = f.read()

    if content_type and (content_type.startswith("text/") or content_type == "application/json"):
        file_content = file_content.decode('utf-8')

    await write_response(writer, content_type=content_type, content=file_content)


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



def send_request(path: str, body: Optional[Union[str, dict]] = None, method: Optional[str] = 'GET', timeout: Optional[int] = 1, base_url: str = 'http://localhost:5544') -> Union[str, bool]:
    """
    Sends an HTTP request to the specified base_url and returns the response
    If a response is received, returns a decoded value of that response

    :param path: The path to send the request to
    :param body: The body of the request; if a dict is provided, it will be converted to a JSON string
    :param method: The HTTP method to use; default to GET
    :param timeout: Request timeout in seconds
    :param base_url: The base URL of the server to send the request to
    :return: The response from the server or False if the request failed
    """
    # Parse the endpoint URL to extract host, port, and scheme
    from urllib.parse import urlparse
    parsed = urlparse(base_url)
    
    if not parsed.hostname:
        raise ValueError(f"Invalid base_url: {base_url}")
    
    host = parsed.hostname
    if parsed.port:
        port = parsed.port
    else:
        # Use default ports based on scheme
        port = 443 if parsed.scheme == 'https' else 80
    
    # For HTTPS requests, we need to handle SSL
    if parsed.scheme == 'https':
        import ssl
        context = ssl.create_default_context()
        sock = socket.create_connection((host, port), timeout=timeout)
        sock = context.wrap_socket(sock, server_hostname=host)
    else:
        sock = socket.create_connection((host, port), timeout=timeout)
    
    # Create proper Host header
    host_header = f'{host}:{port}' if (parsed.scheme == 'http' and port != 80) or (parsed.scheme == 'https' and port != 443) else host

    try:
        headers = [
            f'{method} {path} HTTP/1.1',
            f'Host: {host_header}'
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
    finally:
        sock.close()



class BufferedStreamReader:
    """
    Wraps an asyncio.StreamReader, returning bytes from an initial buffer first, then from the stream.
    """
    def __init__(self, initial_bytes, reader):
        self._buffer = initial_bytes
        self._reader = reader

    async def read(self, n=-1):
        if self._buffer:
            if n == -1 or n >= len(self._buffer):
                data, self._buffer = self._buffer, b''
                if n == -1:
                    rest = await self._reader.read()
                    return data + rest
                else:
                    rest = await self._reader.read(n - len(data)) if n > len(data) else b''
                    return data + rest
            else:
                data, self._buffer = self._buffer[:n], self._buffer[n:]
                return data
        else:
            return await self._reader.read(n)

    async def readexactly(self, n):
        chunks = []
        while n > 0:
            chunk = await self.read(n)
            if not chunk:
                raise IncompleteReadError(b''.join(chunks), n)
            chunks.append(chunk)
            n -= len(chunk)
        return b''.join(chunks)

    async def readuntil(self, separator=b'\n'):
        # Only used for header parsing
        line = b''
        while True:
            c = await self.read(1)
            if not c:
                raise IncompleteReadError(line, len(separator))
            line += c
            if line.endswith(separator):
                break
        return line

    def at_eof(self):
        return not self._buffer and self._reader.at_eof()

    # Add more methods as needed (e.g., readline) for compatibility

    # For compatibility with parse_request expecting a StreamReader
    def __getattr__(self, name):
        return getattr(self._reader, name)

    async def __aiter__(self):
        while not self.at_eof():
            chunk = await self.read(1024)
            if not chunk:
                break
            yield chunk

    # Optionally, implement other StreamReader methods as needed

    async def close(self):
        if hasattr(self._reader, 'close'):
            await self._reader.close()

    # For compatibility with some code
    def feed_eof(self):
        if hasattr(self._reader, 'feed_eof'):
            self._reader.feed_eof()