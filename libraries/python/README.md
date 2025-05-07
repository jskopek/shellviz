# Shellviz Python Library

Shellviz is a zero-hassle Python tool that transforms your data into dynamic, real-time visualizations you can explore right in your browser. It's lightweight, free, and has no dependencies — just install and start visualizing!

# Build
Bundling and deploying Shellviz is straightforward. Run the following command to build a compiled version of the Shellviz client that will be placed in the package's `build` folder:

```bash
cd client
npm run build
```

Once this is done, you can compile the package using poetry:
```bash
cd libraries/python
poetry build
```
To install into a local python environment, run the following command:

```bash
poetry add --no-cache ~/[path-to-repo]/dist/shellviz-0.x.x-py3-none-any.whl
```

