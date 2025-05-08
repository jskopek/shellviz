# Shellviz Python Library

Shellviz is a zero-hassle Python tool that transforms your data into dynamic, real-time visualizations you can explore right in your browser. It's lightweight, free, and has no dependencies — just install and start visualizing!

# 🛠️ Installation

Install Shellviz with pip:

```bash
pip install shellviz
```

# 🔧 Getting Started

## Basic Usage
```python
from shellviz import log, table, json

log('my first shellviz command')
# Shellviz serving on http://127.0.0.1:5544

table([("Alice", 25, 5.6), ("Bob", 30, 5.9)])
json({"name": "Alice", "age": 25, "height": 5.6})
```
Open the generated URL in your browser, and you'll see your data visualized instantly.

## Advanced Usage

**Update Existing Values**
```python
from shellviz import progress
progress(0.0, id='migration')
progress(1.0, id='migration') # Update data dynamically
```

# Django Integration

## Querysets and Models

Shellviz can encode Queryset and Model instances, so you can visualize ORM queries without having to serialize them

```python
from shellviz import json, card
json(request.user)
card(User.objects.all())
```

## Django Logging

Shellviz has an optional drop-in logging handler that can automatically initialize a Shellviz instance and forward all `logging` calls to it

```python
LOGGING = {
    'handlers': {
        'shellviz': {
            'class': 'shellviz.django_logging.ShellvizHandler',
            #...
        },
    }
}
```

## Django Debug Toolbar

Shellviz can be configured to launch as a tab in the Django Debug Toolbar

```python
DEBUG_TOOLBAR_PANELS = [
    #...
    'shellviz.django_debug_toolbar.ShellvizPanel'
    #...
]
```

# Build

Bundling and deploying Shellviz is straightforward. To automate the process of building the client, copying the necessary files, and compiling the Python package, use the provided `build_with_latest_client.py` script:

```bash
# From the libraries/python directory:
python build_with_latest_client.py
```

This script will:
1. Build the Shellviz client (runs `npm install` and `npm run build` in the client directory)
2. Copy the built client files into the Python package
3. Build the Python package using Poetry

Once this is done, you can publish the package to PyPI:

```bash
poetry publish
```

To install into a local python environment, run the following command:

```bash
poetry add --no-cache ~/[path-to-repo]/dist/shellviz-0.x.x-py3-none-any.whl
```