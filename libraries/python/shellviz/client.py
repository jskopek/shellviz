from typing import Optional
import time
import json as jsonFn
from .utils_serialize import to_json_safe
from .utils import get_stack_trace
from .utils_html import send_request, print_qr, get_local_ip
from .server import ShellvizServer
from .config import SHELLVIZ_PORT, SHELLVIZ_SHOW_URL, SHELLVIZ_URL, SHELLVIZ_AUTO_START

class Shellviz:
    def __init__(self, show_url: Optional[bool] = None, port: Optional[int] = None, url: Optional[str] = None, auto_start: Optional[bool] = None):
        """
        Args:
            show_url: Whether to show the URL on startup; defaults to SHELLVIZ_SHOW_URL
            port: The port to use for the server; defaults to SHELLVIZ_PORT
            url: The base URL to use for the server; defaults to SHELLVIZ_URL
            auto_start: Whether to start the server automatically if it is not already running; defaults to SHELLVIZ_AUTO_START
        """
        self.port = port if port is not None else SHELLVIZ_PORT
        self.base_url = url if url is not None else SHELLVIZ_URL
        self.show_url_on_start = show_url if show_url is not None else SHELLVIZ_SHOW_URL
        self.auto_start = auto_start if auto_start is not None else SHELLVIZ_AUTO_START
        
        # Try to connect to existing server
        try:
            send_request('/api/running', base_url=self.base_url)
        except ConnectionRefusedError:
            # Only start a server if we're using localhost (not a custom url)
            if self.auto_start:
                self.start_server()
            else:
                # If using a custom url and can't connect, print a warning
                print(f'Shellviz cannot connect to server at {self.base_url}')

    def start_server(self):
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
        }, method='POST', base_url=self.base_url)

    def clear(self):
        send_request('/api/clear', method='DELETE', base_url=self.base_url)
    
    def wait(self):
        send_request('/api/wait', method='GET', timeout=60*10, base_url=self.base_url)
        
    def show_url(self):
        print(f'Shellviz running on {self.base_url}')

    def show_qr_code(self, warn_on_import_error=True):
        try:
            # if qrcode module is installed, output a QR code with the server's URL; fail silently if the package is not included
            if self.base_url.startswith('http://localhost:') or self.base_url.startswith('http://127.0.0.1:'):
                # For localhost, use the local IP for better mobile access
                print_qr(f'http://{get_local_ip()}:{self.port}')
            else:
                # For custom base_urls, use the base_url directly
                print_qr(self.base_url)
        except ImportError:
            if warn_on_import_error:
                print(f'The `qcode` package (available via `pip install qrcode`) is required to show the QR code')

    # -- Convenience methods for quickly sending data with a specific view --
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
    def log(self, *data, id: Optional[str] = None): 
        data = jsonFn.dumps(to_json_safe(data)) 
        id = id or 'log' #  if an id is provided use it, but if not use 'log' so we can append all logs to the same entry
        value = [(data, time.time())] # create the log entry; a tuple of (data, timestamp) in a list that can be appended to an existing log entry
        self.send(value, id=id, view='log', append=True)
    def table(self, data, id: Optional[str] = None, append: bool = False): 
        formatted_data = data
        if isinstance(data, list) and len(data) > 0 and not isinstance(data[0], list):
            formatted_data = [data] # if the data is a single list, wrap it in another list so it can be displayed as a table
        self.send(formatted_data, id=id, view='table', append=append)