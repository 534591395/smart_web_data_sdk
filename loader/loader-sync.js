import SMARTLib from '../src/main'

class LoaderSync {
  constructor() {
    window['smart'] = this;
  }
  init(token, config) {
    if (this['__loaded']) {
      return ;
    }
    this.instance = new SMARTLib(token, config);
    this.instance.init = this['init'];
    window['smart'] = this.instance;
  }
}

new LoaderSync();