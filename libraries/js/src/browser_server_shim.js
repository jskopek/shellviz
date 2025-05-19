// Browser shim for NodeServer
export default function NodeServer() {
  throw new Error('NodeServer is not available in the browser build of shellviz.');
}
