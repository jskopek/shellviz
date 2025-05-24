from debug_toolbar.panels import Panel
from django.template import engines
from django.conf import settings
from . import _global_shellviz
from .utils.html import get_local_ip
import importlib.resources as resources
import os

class ShellvizPanel(Panel):
    """
    A Django Debug Toolbar panel that embeds Shellviz.

    Usage:
    DJANGO_TOOLBAR_PANELS = [
        # ...
        'shellviz.django.django_debug_toolbar.ShellvizPanel',
        # ...
    ]
    """
    title = 'Shellviz'
    
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
        }) 

    @property
    def content(self):
        # Read the template from the installed package location
        with resources.files('shellviz').joinpath('templates/shellviz/debug_toolbar_panel.html').open('r') as f:
            template_string = f.read()
        template = engines['django'].from_string(template_string)
        context = self.get_stats()
        return template.render(context)