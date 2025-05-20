from typing import Optional
import time
import json as jsonFn
from .utils_serialize import to_json_safe
from .utils import get_stack_trace
from .utils_html import send_request, print_qr, get_local_ip
from .server import ShellvizServer

class Shellviz:
    def __init__(self, port=5544, show_url=True):
        self.port = port
        self.show_url_on_start = show_url
        self._ensure_server()

    def _ensure_server(self):
        try:
            # Try to connect to existing server
            send_request('/api/running', port=self.port)
        except ConnectionRefusedError:
            sv = ShellvizServer(port=self.port)
            sv.initialized_event.wait(timeout=10)  # wait up to 10 seconds for initialization
            if not sv.is_initialized:
                raise Exception('Server failed to initialize within 10 seconds')

            if self.show_url_on_start:
                self.show_url()
                self.show_qr_code(warn_on_import_error=False)


    def send(self, value, id: str = None, view: Optional[str] = None, append: bool = False, wait: bool = False):
        send_request('/api/send', {
            'id': id,
            'data': value,
            'view': view,
            'append': append
        }, self.port, 'POST')

    def clear(self):
        send_request('/api/clear', port=self.port, method='DELETE')
    
    def wait(self):
        send_request('/api/wait', port=self.port, method='GET', timeout=60*10)
        
    def show_url(self):
        print(f'Shellviz running on http://localhost:{self.port}')

    def show_qr_code(self, warn_on_import_error=True):
        try:
            # if qrcode module is installed, output a QR code with the server's URL; fail silently if the package is not included
            print_qr(f'http://{get_local_ip()}:{self.port}')
        except ImportError:
            if warn_on_import_error:
                print(f'The `qcode` package (available via `pip install qrcode`) is required to show the QR code')

    # -- Convenience methods for quickly sending data with a specific view --
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
    def log(self, *data, id: Optional[str] = None): 
        data = jsonFn.dumps(to_json_safe(data)) 
        id = id or 'log' #  if an id is provided use it, but if not use 'log' so we can append all logs to the same entry
        value = [(data, time.time())] # create the log entry; a tuple of (data, timestamp) in a list that can be appended to an existing log entry
        self.send(value, id=id, view='log', append=True)
    def stack(self, id: Optional[str] = None): self.send(get_stack_trace(), id=id, view='stack')