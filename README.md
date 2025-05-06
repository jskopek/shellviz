# Shellviz

Shellviz is a zero-hassle Python tool that transforms your data into dynamic, real-time visualizations you can explore right in your browser. It's lightweight, free, and has no dependencies — just install and start visualizing!

![shellviz](https://github.com/jskopek/shellviz/blob/master/client/public/logo.png).


## 🚀 Features

- **Free & Easy to Use**: No configuration, sign-up, or API key needed.
- **Dynamic Data Manipulation**:
  - Update or append to existing values seamlessly.
  - Clear logs programmatically for a fresh start.
  - View and manage multiple data sources side-by-side.
- **Powerful Visualizations**:
  - Visualize tables, charts, JSON, and more.
  - Search, slice, and filter data with ease.
  - Export data as CSV files.
- **Interactive Second Screen**: Use your phone as a second screen with QR code pairing.
- **Simplified Data Analysis**: Break down complex terminal output for quick insights.

## 🛠️ Installation

Install Shellviz with pip:

```bash
pip install shellviz
```

## 🔧 Getting Started

## Basic Usage
```python
from shellviz import log, table, json

log('my first shellviz command')
# Shellviz serving on http://127.0.0.1:5544

table([("Alice", 25, 5.6), ("Bob", 30, 5.9)])
json({"name": "Alice", "age": 25, "height": 5.6})
```
Open the generated URL in your browser, and you’ll see your data visualized instantly.

### Advanced Usage

**Update Existing Values**
```python
from shellviz import progress
progress(0.0, id='migration')
progress(1.0, id='migration') # Update data dynamically
```

**Append Data**
```python
from shellviz import table

table([('Joe', 10)], id='users')
table([('Jane', 12)], id='users', append=True)
```

**Clear Logs**
```python
from shellviz import clear
clear()
```
**Second-Screen via QR Code**
Install the optional qrcode package for QR code support:

```bash
pip install qrcode
```

```python
from shellviz import show_qr_code
show_qr_code()
```

## 📁 Project Structure

The Shellviz project is organized as a **monorepo** that contains:

- A shared **React client** (`/client`) that powers the interactive visualization.
- A **Python package** (`/python`) published on PyPI.
- A **Node.js package** (`/node`) published on NPM.

Here’s the recommended folder layout:

```
/shellviz/                  ← root of the monorepo
  /client/                  ← React app (shared front-end)
    /src/
    /public/
    /dist/                  ← compiled React build outputs
    package.json
    craco.config.js

  /python/                  ← Python package source
    /shellviz/
      __init__.py
      utils_[...].py
    pyproject.toml

  /node/                    ← Node.js package source
    /src/
    package.json


  README.md
  LICENSE
  .gitignore
```

### How the pieces fit together:
- The **React client** is developed and built separately using `npm run build` in the `/client` directory.  
- The **Python package** lives under `/python`, with its importable code in the `shellviz` subfolder.
- The **Node.js package** lives under `/node` with its own `src` code and `package.json`.

This structure keeps the front-end, Python, and Node.js code **modular and cleanly separated**, while allowing them to share the same client bundle.

## 🏗️ Contributing

We welcome contributions! If you encounter issues or have ideas, feel free to submit an issue or pull request on GitHub.

### Developing client side code
Client-side code is written in React using the `create-react-app` boilerplate. To set up the client side environment, run the following

```bash
cd client
npm install
npm start
```

This should launch a live-updating browser window that will listen for traffic on the default Shellviz websocket port

### Build
Bundling and deploying Shellviz is straightforward. Run the following command to build a compiled version of the Shellviz client that will be placed in the package's `build` folder:

```bash
cd client
npm run build
```

Once this is done, you can compile the package using poetry:
```bash
cd shellviz
poetry build
```
To install into a local python environment, run the following command:

```bash
poetry add --no-cache ~/[path-to-repo]/dist/shellviz-0.x.x-py3-none-any.whl
```

## ⚖️ License

Shellviz is open source and licensed under the MIT License.
