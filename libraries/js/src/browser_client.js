import { toJsonSafe, splitArgsAndOptions, getStackTrace } from './utils.js';

// browser/client.js
export default class Shellviz {
    constructor(port = 5544) {
      this.endpoint = `http://localhost:${port}`;
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

    log = (...args) => {
      const [data, options] = splitArgsAndOptions(args, ['id']);
      const { id = 'log' } = options;
      const safeData = toJsonSafe(data);
      const value = [[safeData, Date.now() / 1000]];
      this.send(value, { id, view: 'log', append: true });
    }
    table = (data, id=null, append=false) => this.send(data, { id, view: 'table', append });
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
    stack = (locals=null, id=null) => this.send(getStackTrace(locals), { id: id, view: 'stack' });

    clear = () => this.send('___clear___');
    wait = () => new Promise(resolve => setTimeout(resolve, 10));
}