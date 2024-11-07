from asyncio import StreamWriter
import mimetypes
import os
import socket
from typing import Optional


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


async def write_file(writer: StreamWriter, file_path: str, template_context: Optional[dict] = None) -> None:
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and returns a response with the content of the file at `file_path`
    Accepts an optional `template_context` dictionary to replace {placeholders} in the file content

    e.g.
        server = await asyncio.start_server(self.handle_http, self.host, self.port)
        async def handle_http(self, reader, writer):
            write_file(writer, 'index.html')
    """
    if not os.path.isfile(file_path):
        response = "HTTP/1.1 404 Not Found\r\n\r\n"
        writer.write(response.encode())
        writer.close()
        return

    content_type, _ = mimetypes.guess_type(file_path)
    content_type = content_type or "application/octet-stream"
    with open(file_path, "r") as f:
        file_content = f.read()

    if template_context:
        file_content = file_content.format(**template_context).encode()

    response = (
        f"HTTP/1.1 200 OK\r\n"
        f"Content-Type: {content_type}\r\n"
        f"Content-Length: {len(file_content)}\r\n"
        "\r\n"
    ).encode() + file_content

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