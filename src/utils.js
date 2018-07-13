import {
  CONFIG
} from './config'

// 兼容单元测试环境
let win;
if (typeof(window) === 'undefined') {
    win = {
      navigator: {}
    };
} else {
    win = window;
}

const _ = {
  each(obj, iterator, context) {
    if (obj === null || obj === undefined) {
      return;
    }
    if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (let i = 0, l = obj.length; i < l; i++) {
            if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                return;
            }
        }
    } else {
      for (let key in obj) {
        if (obj.hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) {
              return;
          }
        }
      }
    }
  },
  extend(obj) {
    _.each(slice.call(arguments, 1), function(source) {
      for (let prop in source) {
          if (source[prop] !== void 0) {
              obj[prop] = source[prop];
          }
      }
    });
    return obj;
  },
  isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.apply(obj) === '[object Array]';
  },
  isObject(obj) {
    return (obj === Object(obj) && !_.isArray(obj));
  },
  isUndefined(obj) {
    return obj === void 0;
  },
  isArguments(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  },
  toArray(iterable) {
    if (!iterable) {
      return [];
    }
    if (iterable.toArray) {
      return iterable.toArray();
    }
    if (_.isArray(iterable)) {
      return slice.call(iterable);
    }
    if (_.isArguments(iterable)) {
      return slice.call(iterable);
    }
    return _.values(iterable);
  },
  values(obj) {
    var results = [];
    if (obj === null) {
        return results;
    }
    _.each(obj, function(value) {
        results[results.length] = value;
    });
    return results;
  },
  // 转化成json
  JSONDecode(string) {
    try {
      return JSON.parse(string);
    } catch (error) {
      return {};
    }
  },
  // json转化为string
  JSONEncode(json) {
    try {
      return JSON.stringify(json);
    } catch (error) {
      return '';
    }
  }
};


// 存储方法封装 localStorage  cookie
_.localStorage = {
  error: function(msg) {
      console.error('localStorage error: ' + msg);
  },

  get: function(name) {
      try {
          return window.localStorage.getItem(name);
      } catch (err) {
          _.localStorage.error(err);
      }
      return null;
  },

  parse: function(name) {
      try {
          return _.JSONDecode(_.localStorage.get(name)) || {};
      } catch (err) {
          // noop
      }
      return null;
  },

  set: function(name, value) {
      try {
          window.localStorage.setItem(name, value);
      } catch (err) {
          _.localStorage.error(err);
      }
  },

  remove: function(name) {
      try {
          window.localStorage.removeItem(name);
      } catch (err) {
          _.localStorage.error(err);
      }
  }
};
_.cookie = {
  get: function(name) {
      var nameEQ = name + '=';
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
              c = c.substring(1, c.length);
          }
          if (c.indexOf(nameEQ) === 0) {
              return decodeURIComponent(c.substring(nameEQ.length, c.length));
          }
      }
      return null;
  },

  parse: function(name) {
      var cookie;
      try {
          cookie = _.JSONDecode(_.cookie.get(name)) || {};
      } catch (err) {
          // noop
      }
      return cookie;
  },

  set_seconds: function(name, value, seconds, cross_subdomain, is_secure) {
      var cdomain = '',
          expires = '',
          secure = '';

      if (cross_subdomain) {
          var matches = document.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
              domain = matches ? matches[0] : '';

          cdomain = ((domain) ? '; domain=.' + domain : '');
      }

      if (seconds) {
          var date = new Date();
          date.setTime(date.getTime() + (seconds * 1000));
          expires = '; expires=' + date.toGMTString();
      }

      if (is_secure) {
          secure = '; secure';
      }

      document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
  },

  set: function(name, value, days, cross_subdomain, is_secure) {
      var cdomain = '', expires = '', secure = '';

      if (cross_subdomain) {
          var matches = document.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
              domain = matches ? matches[0] : '';

          cdomain   = ((domain) ? '; domain=.' + domain : '');
      }

      if (days) {
          var date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          expires = '; expires=' + date.toGMTString();
      }

      if (is_secure) {
          secure = '; secure';
      }

      var new_cookie_val = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
      document.cookie = new_cookie_val;
      return new_cookie_val;
  },

  remove: function(name, cross_subdomain) {
      _.cookie.set(name, '', -1, cross_subdomain);
  }
};

const windowConsole = win.console;
const console = {
  /** @type {function(...[*])} */
  log: function() {
      if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
          try {
              windowConsole.log.apply(windowConsole, arguments);
          } catch (err) {
              _.each(arguments, function(arg) {
                  windowConsole.log(arg);
              });
          }
      }
  },
  /** @type {function(...[*])} */
  error: function() {
      if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
          var args = ['DATracker error:'].concat(_.toArray(arguments));
          try {
              windowConsole.error.apply(windowConsole, args);
          } catch (err) {
              _.each(args, function(arg) {
                  windowConsole.error(arg);
              });
          }
      }
  }
};

export default {_, console};