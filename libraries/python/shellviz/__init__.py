from .client import Shellviz
from typing import Optional

# Global instance of Shellviz
_global_shellviz_instance = None
def _global_shellviz():
    global _global_shellviz_instance
    if not _global_shellviz_instance:
        # print("Shellviz: No instance found. Creating new instance.")
        _global_shellviz_instance = Shellviz()
    return _global_shellviz_instance

# Convenience methods for quickly interacting with a global shellviz instance
def send(data, id: Optional[str] = None, view: Optional[str] = 'text'): _global_shellviz().send(data, id=id, view=view)
def clear(): _global_shellviz().clear()
def show_url(): _global_shellviz().show_url()
def show_qr_code(): _global_shellviz().show_qr_code()
def wait(): _global_shellviz().wait()

def log(*data, id: Optional[str] = None): _global_shellviz().log(*data, id=id)
def table(data, id: Optional[str] = None, append: bool = False): _global_shellviz().table(data, id=id, append=append)
def json(data, id: Optional[str] = None, append: bool = False): _global_shellviz().json(data, id=id, append=append)
def markdown(data, id: Optional[str] = None, append: bool = False): _global_shellviz().markdown(data, id=id, append=append)
def progress(data, id: Optional[str] = None, append: bool = False): _global_shellviz().progress(data, id=id, append=append)
def pie(data, id: Optional[str] = None, append: bool = False): _global_shellviz().pie(data, id=id, append=append)
def number(data, id: Optional[str] = None, append: bool = False): _global_shellviz().number(data, id=id, append=append)
def area(data, id: Optional[str] = None, append: bool = False): _global_shellviz().area(data, id=id, append=append)
def bar(data, id: Optional[str] = None, append: bool = False): _global_shellviz().bar(data, id=id, append=append)
def card(data, id: Optional[str] = None, append: bool = False): _global_shellviz().card(data, id=id, append=append)
def location(data, id: Optional[str] = None, append: bool = False): _global_shellviz().location(data, id=id, append=append)
def raw(data, id: Optional[str] = None, append: bool = False): _global_shellviz().raw(data, id=id, append=append)
def stack(id: Optional[str] = None): _global_shellviz().stack(id=id)