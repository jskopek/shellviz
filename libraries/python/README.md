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
            'class': 'shellviz.django.logging.ShellvizHandler',
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

# Beta Versioning & TestPyPI Workflow

For testing and iterating on new features, Shellviz uses beta versioning following PEP 440 standards and TestPyPI for safe deployment testing.

## Beta Version Format

Beta versions follow the format `X.Y.Zb{number}`:
- `0.5.0b1` - First beta of version 0.5.0
- `0.5.0b2` - Second beta of version 0.5.0
- `0.5.0b15` - Fifteenth beta (final beta before release)

Update the version in `pyproject.toml`:
```toml
[tool.poetry]
version = "0.5.0b1"
```

## Setting Up TestPyPI

TestPyPI is a separate instance of PyPI for testing package uploads without affecting the main PyPI repository.

### 1. Create TestPyPI Account
Visit https://test.pypi.org/account/register/ to create an account.

### 2. Generate API Token
1. Go to https://test.pypi.org/manage/account/token/
2. Click "Add API token"
3. Name it (e.g., "poetry-cli")
4. Set scope to "Entire account"
5. Copy the generated token (starts with `pypi-`)

### 3. Configure Poetry
```bash
# Add TestPyPI repository
poetry config repositories.test-pypi https://test.pypi.org/legacy/

# Set your API token (replace with your actual token)
poetry config pypi-token.test-pypi pypi-AgEIcHlwaS5vcmcCJGYwZjE3...
```

## Publishing to TestPyPI

```bash
# Build the package
poetry build

# Upload to TestPyPI
poetry publish -r test-pypi
```

## Installing from TestPyPI

### Using pip
```bash
# Install specific beta version
pip install --index-url https://test.pypi.org/simple/ shellviz==0.5.0b1

# Install latest pre-release
pip install --index-url https://test.pypi.org/simple/ --pre shellviz
```

### Using Poetry in Another Project

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

### Manual pyproject.toml Configuration
```toml
[[tool.poetry.source]]
name = "test-pypi"
url = "https://test.pypi.org/simple/"
priority = "explicit"

[tool.poetry.dependencies]
python = "^3.9"
shellviz = {version = "0.5.0b1", source = "test-pypi"}
```

## Recommended Beta Workflow

1. **Early Development (b1-b10)**: Use TestPyPI exclusively
   - Rapid iteration without cluttering main PyPI
   - Test full upload/download workflow
   - Share with early testers

2. **Final Testing (b11-b15)**: Optionally use main PyPI
   - Wider audience for final validation
   - Users must explicitly request with `--pre` flag
   - Clean transition to stable release

3. **Stable Release**: Publish `0.5.0` to main PyPI
   - Remove beta versions from TestPyPI if desired
   - Update documentation and changelogs

## Version Management Tips

- **Sequential numbering**: Always increment beta numbers (`b1`, `b2`, `b3`, etc.)
- **No gaps**: Don't skip beta numbers to maintain clear progression
- **Final release**: Go directly from final beta to stable (e.g., `0.5.0b15` → `0.5.0`)
- **Version ordering**: Python correctly sorts `0.5.0b1 < 0.5.0b2 < 0.5.0rc1 < 0.5.0`

# ShellViz Configuration

ShellViz supports configuration through environment variables and Django settings with a clear fallback hierarchy.

## Configuration Hierarchy

1. **Constructor parameters** (highest priority)
2. **Django Settings** (if Django is available and configured)  
3. **Environment Variables**
4. **Default Values** (visible in function declarations)

## Available Configuration Options

### Environment Variables

All environment variables are prefixed with `SHELLVIZ_`:

- `SHELLVIZ_PORT` - Port number for the server (default: 5544)
- `SHELLVIZ_SHOW_URL` - Whether to show URL on startup (default: true)
- `SHELLVIZ_URL` - Custom base URL for the server (default: None, constructs from port)

### Django Settings

If you're using Django, you can set these in your `settings.py`:

```python
# settings.py
SHELLVIZ_PORT = 8080
SHELLVIZ_SHOW_URL = False
SHELLVIZ_URL = "https://my-custom-domain.com"
```

### Environment Variable Examples

```bash
# Set port to 8080
export SHELLVIZ_PORT=8080

# Disable URL display on startup
export SHELLVIZ_SHOW_URL=false

# Use a custom URL
export SHELLVIZ_URL="https://my-remote-shellviz.com"

# Run your Python script
python my_script.py
```

## Usage Examples

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

### Python Server

```python
from shellviz.server import ShellvizServer

# Uses default: port=5544
# Overridden by Django settings or env vars if present
server = ShellvizServer()

# Override port
server = ShellvizServer(port=9000)
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

## Configuration Implementation

The configuration values are computed once when the module is imported:

```python
# In your code, you can import the computed values directly:
from shellviz.config import SHELLVIZ_PORT, SHELLVIZ_SHOW_URL, SHELLVIZ_URL

# These will be None if not set via Django/env vars
print(SHELLVIZ_PORT)      # e.g., 8080 or None
print(SHELLVIZ_SHOW_URL)  # e.g., False or None  
print(SHELLVIZ_URL)       # e.g., "https://my-server.com" or None
```

## Boolean Values

For boolean environment variables, the following values are considered `true`:
- `true`
- `1` 
- `yes`
- `on`

All other values are considered `false`.

## Default Values

Default values are clearly visible in the function declarations:

```python
# Client defaults
def __init__(self, show_url: bool = True, port: int = 5544, url: Optional[str] = None):

# Server defaults  
def __init__(self, port: int = 5544):
```

Environment variables and Django settings automatically override these defaults when present. 