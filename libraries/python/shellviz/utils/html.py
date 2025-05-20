from asyncio import StreamReader, StreamWriter
from dataclasses import dataclass
import json
import mimetypes
import os
import socket
from typing import Optional, Union
import asyncio
import atexit
import threading
import time
import http.client
import urllib.parse
from http.server import BaseHTTPRequestHandler
from io import BytesIO


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
    Parses a raw HTTP request from an asyncio StreamReader and returns an HttpRequest object.
    """
    # Read header section
    headers_bytes = bytearray()
    while True:
        chunk = await reader.read(1024)
        if not chunk:
            break
        headers_bytes.extend(chunk)
        if b'\r\n\r\n' in headers_bytes:
            break

    if not headers_bytes:
        print("No data received")
        return HttpRequest()

    # Split header and initial body
    header_end = headers_bytes.find(b'\r\n\r\n')
    if header_end == -1:
        print("Invalid HTTP request (no header-body separator)")
        return HttpRequest()

    raw_headers = headers_bytes[:header_end]
    body_buffer = bytearray(headers_bytes[header_end + 4:])

    # Extract content length
    headers_text = raw_headers.decode(errors="replace")
    content_length = 0
    for line in headers_text.splitlines():
        if line.lower().startswith('content-length:'):
            try:
                content_length = int(line.split(':', 1)[1].strip())
            except ValueError:
                content_length = 0
            break

    # Read the rest of the body if needed
    remaining = content_length - len(body_buffer)
    while remaining > 0:
        chunk = await reader.read(min(1024, remaining))
        if not chunk:
            break
        body_buffer.extend(chunk)
        remaining -= len(chunk)

    # Final combined request data
    full_request = raw_headers + b'\r\n\r\n' + body_buffer

    # Log raw request
    print("\n=== Raw Request Data ===")
    print(f"Total bytes length: {len(full_request)}")
    print("Raw bytes (hex):", full_request.hex())
    print("\nRaw text:")
    print(full_request.decode(errors='replace'))
    print("=====================\n")

    # Parse using BaseHTTPRequestHandler
    class RequestHandler(BaseHTTPRequestHandler):
        def __init__(self, data: bytes):
            self.rfile = BytesIO(data)
            self.raw_requestline = self.rfile.readline()
            self.error_code = self.error_message = None
            self.parse_request()

    handler = RequestHandler(full_request)

    if handler.error_code:
        print(f"HTTP parsing error: {handler.error_code} - {handler.error_message}")
        return HttpRequest()

    # Log parsed request
    print("\n=== Parsed Request ===")
    print(f"Method: {handler.command}")
    print(f"Path: {handler.path}")
    print("Headers:")
    for k, v in handler.headers.items():
        print(f"  {k}: {v}")
    print("=====================\n")

    body = body_buffer.decode(errors='replace') if body_buffer else None

    if body:
        print("\n=== Request Body ===")
        print(body)
        print("===================\n")

    return HttpRequest(method=handler.command, path=handler.path, body=body)


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


def send_request(path: str, body: Optional[Union[str, dict]] = None, port: Optional[int] = 5544, method: Optional[str] = 'GET', ip_address: Optional[str] = '127.0.0.1') -> Union[str, bool]:
    """
    Sends an HTTP request to the local server and returns the response.
    Uses Python's built-in http.client for robust HTTP handling.
    
    Args:
        path: The path to send the request to
        body: The body of the request; if a dict is provided, it will be converted to a JSON string
        port: The port to send the request to; default to 5544
        method: The HTTP method to use; default to GET
        ip_address: The IP address to send the request to; default to 127.0.0.1
    
    Returns:
        The response body as a string if successful, False if an error occurs
    """
    try:
        conn = http.client.HTTPConnection(ip_address, port, timeout=1)
        
        # Prepare headers
        headers = {}
        if body:
            if isinstance(body, dict):
                body = json.dumps(body)
                headers['Content-Type'] = 'application/json'
            headers['Content-Length'] = str(len(body))
        
        # Log the request details before sending
        print("\n=== Sending Request ===")
        print(f"Method: {method}")
        print(f"Path: {path}")
        print("Headers:")
        for header, value in headers.items():
            print(f"  {header}: {value}")
        if body:
            print("\nBody:")
            print(body)
        print("=====================\n")
        
        # Send request
        conn.request(method, path, body=body, headers=headers)
        
        # Get response
        response = conn.getresponse()
        print("\n=== Response ===")
        print(f"Status: {response.status} {response.reason}")
        print("Response Headers:")
        for header, value in response.getheaders():
            print(f"  {header}: {value}")
        
        response_data = response.read().decode()
        print("\nResponse Body:")
        print(response_data)
        print("=================\n")
        
        # Close connection
        conn.close()
        
        return response_data
        
    except Exception as e:
        print(f"\n=== Error in send_request ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {e}")
        print("===========================\n")
        return False