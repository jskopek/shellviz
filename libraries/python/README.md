# Shellviz Python Library

Shellviz is a zero-hassle Python tool that transforms your data into dynamic, real-time visualizations you can view right in your browser. It's lightweight, free, and has no dependencies — just install and start visualizing!

# 🛠️ Installation

Install Shellviz with pip:

```bash
pip install shellviz
```

If you want to integrate the Shellviz widget directly in your webpage, add the following script to your page:

```html
<script src="https://unpkg.com/shellviz"></script>
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

# Shellviz Server

Shellviz consists of a logging server and a client. The client first checks to see if an existing server is running, and initializes a server if one is not detected. This behavior can be configured with the `SHELLVIZ_AUTO_START` configuration setting. By default, a server is created unless a `DEBUG` environment variable is set to `False`.

The server can be manually initialized by calling the `start_server` method:

```python
from shellviz import Shellviz
Shellviz().start_server()
```

# Django Integration

## Django Logging

Shellviz has an optional drop-in logging handler that can automatically initialize a Shellviz instance and forward all `logging` calls to it

```python
LOGGING = {
    'handlers': {
        'shellviz': {
            'class': 'shellviz.django.logging.ShellvizHandler',
            # Automatically starts the server if DEBUG=True
            # In production, set SHELLVIZ_AUTO_START=True to override
        },
    },
    'root': {
        'handlers': ['shellviz'],
        'level': 'INFO',
    },
}
```

By default, this handler starts a Shellviz server when `DEBUG=True`. This behavior can be overridden with the `SHELLVIZ_AUTO_START` configuration. See [shellviz server](#shellviz-server) for details.

## Querysets and Models

Shellviz can encode Queryset and Model instances, so you can visualize ORM queries without having to serialize them

```python
from shellviz import json, card
json(request.user)
card(User.objects.all())
```

# Generic Timing Mixin

Shellviz includes a `TimingMixin` that automatically logs timing information for ALL method calls on any class. Simply inherit from `TimingMixin` and all your methods will be automatically timed:

```python
# For Django CBVs
from django.views.generic import ListView
from shellviz.django import TimingMixin

class ProjectListView(TimingMixin, ListView):
    model = Project
    # ... other view configuration

# For any custom class
class MyCustomClass(TimingMixin):
    def method_one(self):
        # This will be automatically timed
        pass
    
    def method_two(self):
        # This will also be automatically timed
        pass
```

The mixin automatically intercepts and times ALL method calls, with timestamps relative to the start of the first method call.

Example output in Shellviz:
```
timing_ProjectListView: dispatch: 0.000s
timing_ProjectListView: get_queryset: 0.101s
timing_ProjectListView: get_context_data: 0.102s
timing_ProjectListView: render_to_response: 0.150s

timing_MyCustomClass: method_one: 0.100s
timing_MyCustomClass: method_two: 0.150s
```

# Configuration

- `SHELLVIZ_PORT` - Port number for the server (default: 5544)
- `SHELLVIZ_SHOW_URL` - Whether to show URL on startup (default: true)
- `SHELLVIZ_URL` - Custom base URL for the server (default: None, constructs from port)
- `SHELLVIZ_AUTO_START` - Whether the server should start automatically (default: DEBUG or True). See [shellviz server](#shellviz-server) for details.

If you're using Django, you can set these in your `settings.py`, e.g.:

```python
# settings.py
SHELLVIZ_PORT = 8080
```

# Usage Examples

### Python Client

```python
from shellviz import Shellviz

# Uses defaults: show_url=True, port=5544, url=None
# Overridden by Django settings or env vars if present
sv = Shellviz()

# Override specific settings
sv = Shellviz(port=9000, show_url=False)

# Use a custom URL
sv = Shellviz(url="https://my-server.com")
```

### JavaScript Client

```javascript
import { Shellviz } from 'shellviz';

// Uses configuration from process.env -> defaults
const sv = new Shellviz();

// Override specific settings
const sv = new Shellviz({ port: 9000, base_url: "https://my-server.com" });
```

### JavaScript Server

```javascript
import ShellvizServer from 'shellviz/server';

// Uses configuration from process.env -> defaults
const server = new ShellvizServer();

// Override settings
const server = new ShellvizServer({ port: 9000, showUrl: false });
```


# Development

## Build

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

## Beta Versioning & TestPyPI Workflow

For testing and iterating on new features, Shellviz uses beta versioning following PEP 440 standards and TestPyPI for safe deployment testing.

### Beta Version Format

Beta versions follow the format `X.Y.Zb{number}`:
- `0.5.0b1` - First beta of version 0.5.0
- `0.5.0b2` - Second beta of version 0.5.0
- `0.5.0b15` - Fifteenth beta (final beta before release)

Update the version in `pyproject.toml`:
```toml
[tool.poetry]
version = "0.5.0b1"
```

### Setting Up TestPyPI

TestPyPI is a separate instance of PyPI for testing package uploads without affecting the main PyPI repository.

1. Create TestPyPI Account
Visit https://test.pypi.org/account/register/ to create an account.

2. Generate API Token
1. Go to https://test.pypi.org/manage/account/token/
2. Click "Add API token"
3. Name it (e.g., "poetry-cli")
4. Set scope to "Entire account"
5. Copy the generated token (starts with `pypi-`)

3. Configure Poetry
```bash
# Add TestPyPI repository
poetry config repositories.test-pypi https://test.pypi.org/legacy/

# Set your API token (replace with your actual token)
poetry config pypi-token.test-pypi pypi-AgEIcHlwaS5vcmcCJGYwZjE3...
```

4. Publishing to TestPyPI

```bash
# Build the package
poetry build

# Upload to TestPyPI
poetry publish -r test-pypi
```

5. Installing from TestPyPI

```bash
# Install specific beta version
pip install --index-url https://test.pypi.org/simple/ shellviz==0.5.0b1

# Install latest pre-release
pip install --index-url https://test.pypi.org/simple/ --pre shellviz
```

or

First, add TestPyPI as a source in your target project:
```bash
poetry source add test-pypi https://test.pypi.org/simple/ --priority=explicit
```

Then install the beta package:
```bash
# Install specific beta version
poetry add shellviz==0.5.0b1 --source test-pypi

# Or allow pre-releases
poetry add shellviz --allow-prereleases --source test-pypi
```