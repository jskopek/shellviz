import NodeServer from './node_server.js';
import ShellvizClient from './browser_client.js';

class ShellvizNodeClient extends ShellvizClient {
    async _ensureServer() {
        if (this.existingServerFound) return;
        const exists = await this._checkExistingServer();
        if (!exists) {
            this.server = new NodeServer({ port: this.port, showUrl: true });
            await new Promise(r => setTimeout(r, 200));
        }
        this.existingServerFound = true;
    }
}

export default ShellvizNodeClient;