// browser/client.js
export default class Shellviz {
    constructor(port = 5544) {
      this.endpoint = `http://${location.hostname}:${port}`;
      this.entries = [];
    }
  
 
    /* ---------------- public helpers ---------------- */
  
    async send(data, { id = Date.now().toString(), view='log', append=false } = {}) {
      try {
        const response = await fetch(`${this.endpoint}/api/send`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ id, data, view, append })
        });
        if (!response.ok) {
          throw new Error('Failed to send data');
        }
      } catch (error) {
        console.log(data);
        console.warn('Could not connect to shellviz server');
      }
    }

    table = (data, id=null, append=false) => this.send(data, { id, view: 'table', append });
    log = (data, id=null, append=true) => this.send([[data, Date.now() / 1000]], { id: id || 'log', view: 'log', append });
    json = (data, id=null, append=false) => this.send(data, { id: id, view: 'json', append });
    markdown = (data, id=null, append=false) => this.send(data, { id: id, view: 'markdown', append });
    progress = (data, id=null, append=false) => this.send(data, { id: id, view: 'progress', append });
    pie = (data, id=null, append=false) => this.send(data, { id: id, view: 'pie', append });
    number = (data, id=null, append=false) => this.send(data, { id: id, view: 'number', append });
    area = (data, id=null, append=false) => this.send(data, { id: id, view: 'area', append });
    bar = (data, id=null, append=false) => this.send(data, { id: id, view: 'bar', append });
    card = (data, id=null, append=false) => this.send(data, { id: id, view: 'card', append });
    location = (data, id=null, append=false) => this.send(data, { id: id, view: 'location', append });
    raw = (data, id=null, append=false) => this.send(data, { id: id, view: 'raw', append });

    clear = () => this.send('___clear___');
    wait = () => new Promise(resolve => setTimeout(resolve, 10));
}