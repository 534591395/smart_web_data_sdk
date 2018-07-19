import {
  CONFIG
} from './config'

import { Base64 } from 'js-base64'
import sha1 from 'sha1'

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
  },
  // 判断类型是否为function
  isFunction(fn) {
    let bool = false;
    if (typeof (fn) === 'function') {
      bool = true;
    }
    return bool;
  },
  base64Encode(str) {
    return Base64.encode(str);
  },
  sha1(str) {
    return sha1(str);
  },
  // 对象的字段值截取
  truncate(obj, length) {
    let ret;
    if (typeof(obj) === 'string') {
        ret = obj.slice(0, length);
    } else if (_.isArray(obj)) {
        ret = [];
        _.each(obj, function(val) {
            ret.push(_.truncate(val, length));
        });
    } else if (_.isObject(obj)) {
        ret = {};
        _.each(obj, function(val, key) {
            ret[key] = _.truncate(val, length);
        });
    } else {
        ret = obj;
    }
    return ret;
  },
  isNumber(obj) {
    return Object.prototype.toString.call(obj) == '[object Number]';
  },
  HTTPBuildQuery(formdata, arg_separator) {
    let use_val, use_key, tmp_arr = [];

    if (_.isUndefined(arg_separator)) {
        arg_separator = '&';
    }

    _.each(formdata, function(val, key) {
        use_val = encodeURIComponent(val.toString());
        use_key = encodeURIComponent(key);
        tmp_arr[tmp_arr.length] = use_key + '=' + use_val;
    });

    return tmp_arr.join(arg_separator);
  }
};

// 发送数据
_.sendRequest = function(url, type, data, callback) {
  data['_'] = new Date().getTime().toString();
  if (type === 'img') {
    url += '?' + _.HTTPBuildQuery(data);
    let img = document.createElement('img');
    img.src = url;
    img.width = 1;
    img.height = 1;
    if (_.isFunction(callback)) {
        callback(0);
    }
    img.onload = function() {
      this.onload = null;
    };
    img.onerror = function() {
      this.onerror = null;
    };
    img.onabort = function() {
      this.onabort = null;
    };
  } else if (type === 'get') {
    url += '?' + _.HTTPBuildQuery(data);
    _.ajax.get(url, callback);
  } else if (type === 'post') {
    _.ajax.get(url, data , callback); 
  }
};

_.ajax = {
    post: function(url, options, callback, timeout) {
      var that = this;  
      that.callback = callback || function(params) {};  
      try {
          var req = new XMLHttpRequest();
          req.open('POST', url, true);
          req.setRequestHeader("Content-type","application/json");
          req.withCredentials = true;
          req.ontimeout = function() {
              that.callback({status: 0, error: true, message: 'request ' +url + ' time out'});
          };
          req.onreadystatechange = function () {
              if (req.readyState === 4) {
                  if (req.status === 200) {
                      that.callback(_.JSONDecode(req.responseText));
                  } else {
                      var message = 'Bad HTTP status: ' + req.status + ' ' + req.statusText;
                      that.callback({status: 0, error: true, message: message});
                  }
              }
          };
          req.timeout = timeout || 5000;
          req.send(_.JSONEncode(options));
      } catch (e) {}
    },
    get: function(url, callback) {
      try {
          var req = new XMLHttpRequest();
          req.open('GET', url, true);
          req.withCredentials = true;
          req.onreadystatechange = function () {
              if (req.readyState === 4) {
                  if (req.status === 200) {
                      if (callback) {
                          callback(req.responseText);
                      }
                  } else {
                      if (callback) {
                          var message = 'Bad HTTP status: ' + req.status + ' ' + req.statusText;
                          callback({status: 0, error: true, message: message});
                      }
                  }
              }
          };
          req.send(null);
      } catch (e) {}
    }
  };

// uuid
_.UUID = (function() {
    var T = function() {
      var d = 1 * new Date(), i = 0;
      while (d == 1 * new Date()) {
        i++;
      }
      return d.toString(16) + i.toString(16);
    };
    var R = function() {
      return Math.random().toString(16).replace('.', '');
    };
    var UA = function(n) {
      var ua = navigator.userAgent, i, ch, buffer = [], ret = 0;
  
      function xor(result, byte_array) {
        var j, tmp = 0;
        for (j = 0; j < byte_array.length; j++) {
          tmp |= (buffer[j] << j * 8);
        }
        return result ^ tmp;
      }
  
      for (i = 0; i < ua.length; i++) {
        ch = ua.charCodeAt(i);
        buffer.unshift(ch & 0xFF);
        if (buffer.length >= 4) {
          ret = xor(ret, buffer);
          buffer = [];
        }
      }
  
      if (buffer.length > 0) {
        ret = xor(ret, buffer);
      }
  
      return ret.toString(16);
    };
  
    return function() {
      // 有些浏览器取个屏幕宽度都异常...
      var se = String(screen.height * screen.width);
      if (se && /\d{5,}/.test(se)) {
        se = se.toString(16);
      } else {
        se = String(Math.random() * 31242).replace('.', '').slice(0, 8);
      }
      var val = (T() + '-' + R() + '-' + UA() + '-' + se + '-' + T());
      if(val){
        just_test_distinctid_2 = 1;
        return val; 
      }else{
        just_test_distinctid_2 = 2;
        return (String(Math.random()) + String(Math.random()) + String(Math.random())).slice(2, 15);
      }
  
    };
})();

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