/**
 * 单页面模块
 */
import {_} from './utils';

function on(obj, event, callFn) {
  if(obj[event]) {
    const fn = obj[event];
    obj[event] = function() {
      const args = Array.prototype.slice.call(arguments);
      callFn.apply(this, args);
      fn.apply(this, args);
    };
  } else {
    obj[event] = function() {
      const args = Array.prototype.slice.call(arguments);
      callFn.apply(this, args);
    };
  }
}

function getPath() {
  return location.pathname + location.search;
}

const SPA = {
  config: {
    mode: 'hash',
    track_replace_state: false,
    callback_fn: () => {}
  },
  init(config) {
    this.config = _.extend(this.config, config || {});
    this.path = getPath();
    this.event();
  },
  event() {
    if(this.config.mode === 'history') {
      if(!history.pushState || !window.addEventListener) return;
      on(history, 'pushState', this.pushStateOverride.bind(this) );
      on(history, 'replaceState', this.replaceStateOverride.bind(this) );
      window.addEventListener('popstate', this.handlePopState.bind(this));
    } else if(this.config.mode === 'hash') {
      _.register_hash_event( this.handleHashState.bind(this) );
    }
  },
  pushStateOverride(){
    this.handleUrlChange(true);
  },
  replaceStateOverride() {
    this.handleUrlChange(false);
  },
  handlePopState() {
    this.handleUrlChange(true);
  },
  handleHashState() {
    this.handleUrlChange(true);
  },
  handleUrlChange(historyDidUpdate) {
    setTimeout(() => {
      if(this.config.mode === 'hash') {
        if(_.isFunction(this.config.callback_fn)) {
          this.config.callback_fn.call();
          _.innerEvent.trigger('singlePage:change');
        }
      } else if( this.config.mode === 'history' ) {
        const oldPath = this.path;
        const newPath = getPath();
        if(oldPath != newPath && this.shouldTrackUrlChange(newPath, oldPath)) {
          this.path = newPath;
          if(historyDidUpdate || this.config.track_replace_state) {
            if(typeof this.config.callback_fn === 'function') {
              this.config.callback_fn.call();
              _.innerEvent.trigger('singlePage:change');
            }
          }
        }
      }
    }, 0);
  },
  shouldTrackUrlChange(newPath, oldPath) {
    return !!(newPath && oldPath);
  }
};

export default SPA;
