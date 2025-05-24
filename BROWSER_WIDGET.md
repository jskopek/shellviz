# ShellViz Browser Widget

The ShellViz Browser Widget provides a client-side fallback when the ShellViz server is not available. This allows you to use ShellViz visualizations in any web page without needing to run a separate Node.js server.

## How It Works

1. **Automatic Fallback**: When you call ShellViz functions in a browser and no server is available, ShellViz automatically switches to widget mode
2. **Embedded React App**: The widget uses embedded React application assets, so it works completely offline
3. **Floating UI**: Creates a floating bubble that expands into a visualization panel
4. **Full Feature Support**: Supports all ShellViz visualization types (tables, charts, JSON, markdown, etc.)

## Usage

### Automatic Mode (Recommended)

Simply use ShellViz functions normally in your browser:

```javascript
import * as shellviz from 'shellviz';

// This will automatically create the widget if no server is available
shellviz.log('Hello, World!');
shellviz.table([['Name', 'Age'], ['Alice', 30], ['Bob', 25]]);
shellviz.json({ status: 'success', data: [1, 2, 3] });
```

### Manual Mode

You can also manually create the widget:

```javascript
import { renderInBrowser } from 'shellviz';

// Manually create the widget
renderInBrowser();

// Then send data
shellviz.log('Widget is ready!');
```

## Features

- 🎯 **Automatic Fallback**: No server? No problem! Widget mode kicks in automatically
- 📱 **Responsive UI**: 60px floating bubble that expands to 300x500px panel
- 🎨 **Full Visualization Support**: All chart types, tables, JSON, markdown, etc.
- 💾 **Client-Side Storage**: Data is stored locally and displayed in real-time
- 🔄 **Hot Switching**: Seamlessly switches between server and widget modes
- 📦 **Embedded Assets**: Works completely offline with no external dependencies

## Widget UI

- **Collapsed**: Small floating bubble in bottom-right corner
- **Expanded**: 300x500px panel with header and close button
- **Fallback**: Simple data viewer if React assets aren't available

## Build Process

The widget uses embedded React application assets:

1. `npm run copy:client` - Copies React build from `../../client/build/`
2. `npm run embed:assets` - Embeds CSS/JS assets into `embedded-assets.js`
3. `npm run build` - Builds all client variants with embedded assets

## Browser Compatibility

- Modern browsers with ES6 module support
- Works in both development and production environments
- No external dependencies required

## Example

See `test-widget.html` for a complete working example that demonstrates:
- Automatic fallback behavior
- Manual widget creation
- Multiple data types
- Real-time updates

## API

### `renderInBrowser()`
Manually creates the floating widget interface.

### Automatic Behavior
When any ShellViz function is called and no server is available:
1. Widget is automatically created
2. Data is stored locally
3. Visualizations are displayed in the widget

This provides a seamless experience whether running with or without a server. 