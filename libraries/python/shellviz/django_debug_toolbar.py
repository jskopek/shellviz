from debug_toolbar.panels import Panel
from . import _global_shellviz
from .utils_html import get_local_ip

class ShellvizPanel(Panel):
    """
    A Django Debug Toolbar panel that embeds Shellviz.

    Usage:
    DJANGO_TOOLBAR_PANELS = [
        # ...
        'shellviz.django_debug_toolbar.ShellvizPanel',
        # ...
    ]
    """
    title = 'Shellviz'
    template = 'shellviz/debug_toolbar_panel.html'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.shellviz = _global_shellviz()
    
    # @property
    # def nav_subtitle(self):
    #     # Show the number of entries
    #     count = len(self.shellviz.entries)
    #     return f"{count} entr{'y' if count == 1 else 'ies'}"

    def generate_stats(self, request, response):
        """Generate statistics for the panel."""
        self.record_stats({
            'shellviz_url': f'http://{get_local_ip()}:{self.shellviz.port}',
            'entries': self.shellviz.entries
        }) 