import time
from typing import Optional
from .server import ShellvizServer
from .utils.html import send_request
from .utils.serialize import to_json_string
from .utils.general import get_stack_trace

class ShellvizClient:
    def __init__(self, port=5544, show_url=True):
        self.port = port
        # Check if server is running
        self.existing_server_found = True if send_request('/api/running', port=port) else False
        if not self.existing_server_found:
            self.server = ShellvizServer(port=port, show_url=show_url)
            self.server.start()
        else:
            self.server = None

    def send(self, data, id: Optional[str] = None, view: Optional[str] = 'text', append: bool = False):
        payload = {
            'data': data,
            'id': id,
            'view': view,
            'append': append,
        }
        send_request('/api/send', body=payload, port=self.port, method='POST')

    def clear(self):
        send_request('/api/clear', port=self.port, method='DELETE')

    def show_url(self):
        if self.server:
            self.server.show_url()
        else:
            print(f'Serving on http://localhost:{self.port}')

    def show_qr_code(self):
        if self.server:
            self.server.show_qr_code()
        else:
            print('QR code available only if server was started by this client.')

    def wait(self):
        input('Press Enter to continue...')

    def log(self, *data, id: Optional[str] = None):
        id = id or 'log'
        data = to_json_string(data)
        value = [(data, time.time())]
        self.send(value, id=id, view='log', append=True)

    def table(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='table', append=append)
    def json(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='json', append=append)
    def markdown(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='markdown', append=append)
    def progress(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='progress', append=append)
    def pie(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='pie', append=append)
    def number(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='number', append=append)
    def area(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='area', append=append)
    def bar(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='bar', append=append)
    def card(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='card', append=append)
    def location(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='location', append=append)
    def raw(self, data, id: Optional[str] = None, append: bool = False): self.send(data, id=id, view='raw', append=append)
    def stack(self, id: Optional[str] = None): self.send(get_stack_trace(), id=id, view='stack')

