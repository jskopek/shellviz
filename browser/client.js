// browser/client.js
export default class ShellVizClient {
    constructor(endpoint = `http://${location.hostname}:5544`) {
      console.log('constructor', endpoint);
      this.endpoint = endpoint;
      // this.mode = 'unknown';
      this.mode = 'remote';
      this.entries = [];
    }
  
    async init() {
      console.log('init', this.endpoint);
      // try {
      //   const ok = await fetch(`${this.endpoint}/api/running`, { cache:'no-store' });
      //   this.mode = ok && ok.ok ? 'remote' : 'embedded';
      // } catch {
      //   this.mode = 'embedded';
      // }
      // if (this.mode === 'embedded') this.mountUi();
    }
  
    /* ---------------- public helpers ---------------- */
  
    send(data, { id = Date.now().toString(), view='log', append=false } = {}) {
      // console.log('sending', data, id, view, append);
      if (this.mode === 'remote') {
        // console.log('sending to remote', `${this.endpoint}/api/send`, data, id, view, append);
        return fetch(`${this.endpoint}/api/send`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ id, data, view, append })
        });
      }
      /* Embedded: dispatch custom event so React UI updates */
      window.dispatchEvent(new CustomEvent('shellviz:entry', {
        detail:{ id, data, view, append }
      }));
    }
    log = (d,i) => this.send([[d,Date.now()/1000]],{id:i||'log',view:'log',append:true});
    json = (d,i) => this.send(d,{id:i,view:'json'});
    table = (d,i)=>this.send(d,{id:i,view:'table'});
  
    /* ---------------- private ---------------- */
  
    mountUi() {
      if (document.getElementById('__shellviz_root')) return;
      const host = document.createElement('div');
      host.id='__shellviz_root';
      host.style.cssText='all:unset;position:fixed;inset:0;z-index:2147483647;';
      document.body.appendChild(host);
  
      const s = document.createElement('script');
      s.src='https://unpkg.com/shellviz-react-ui@latest/dist/standalone.js';
      s.onload = () => window.__shellvizMount?.(host,this.entries);
      document.body.appendChild(s);
    }
  }
  