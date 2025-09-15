
import os
import json
from django import template
from django.utils.safestring import mark_safe
from django.templatetags.static import static

register = template.Library()

@register.simple_tag
def shellviz_script():
    # try:
    #     # Construct the path to the asset-manifest.json file
    #     static_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'shellviz')
    #     manifest_path = os.path.join(static_dir, 'asset-manifest.json')

    #     if not os.path.exists(static_dir):
    #         return mark_safe('<!-- Shellviz static directory not found -->')

    #     with open(manifest_path) as f:
    #         manifest = json.load(f)

    #     # Get the path to the main.js file
    #     main_js_path = manifest['files']['main.js']

    #     # Construct the full static path
    #     static_path = static(os.path.join('shellviz', main_js_path.lstrip('/')))

    #     return mark_safe(f'<script src="{static_path}"></script>')
    # except (FileNotFoundError, KeyError):
    #     # Fallback or error handling
    #     return mark_safe('<!-- Shellviz script not found -->')
    return mark_safe('<script src="https://unpkg.com/shellviz@0.5.0-beta.0"></script>')

