import {
  CONFIG
} from './config'


import device from './device'

import {base64Encode} from './coding'

import detector from './useragent'

// 兼容单元测试环境
let win;
if (typeof(window) === 'undefined') {
    win = {
      navigator: {
        userAgent: ''
      },
      location: {
        pathname: '',
        href: ''
      },
      document: {
        
      },
      screen: {
        width: '',
        height: ''
      }
    };
} else {
  win = window;
}

const breaker = {};

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
    _.each(Array.prototype.slice.call(arguments, 1), function(source) {
      for (let prop in source) {
          if (source[prop] !== void 0) {
              obj[prop] = source[prop];
          }
      }
    });
    return obj;
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
      return Array.prototype.slice.call(iterable);
    }
    if (_.isArguments(iterable)) {
      return Array.prototype.slice.call(iterable);
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
    return base64Encode(str);
  },
  sha1(str) {
    return '';
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
  isString(str) {
    return Object.prototype.toString.call(str) == '[object String]';
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
  },
  // 删除左右两端的空格
  trim(str){
    if (!str) return; 
　  return str.replace(/(^\s*)|(\s*$)/g, "");
  },
  // 验证yyyy-MM-dd日期格式
  checkTime(timeString) {
    const reg = /^(\d{4})-(\d{2})-(\d{2})$/;
    if(timeString) {
      if (!reg.test(timeString)){
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  },
  // 返回指定url的域名
  // 若不传入url，返回当前网页的域名
  getHost(url) {
    let host = '';
    if (!url) {
      url = win.location.href;
    }
    const regex = /.*\:\/\/([^\/]*).*/;
    const match = url.match(regex);
    if (match) {
      host = match[1];
    }
    return host;
  }
};
_.isArray = Array.isArray || function(obj) {
  return Object.prototype.toString.apply(obj) === '[object Array]';
};

_.register_event = (function() {
    // written by Dean Edwards, 2005
    // with input from Tino Zijdel - crisp@xs4all.nl
    // with input from Carl Sverre - mail@carlsverre.com
    // with input from DATracker
    // http://dean.edwards.name/weblog/2005/10/add-event/
    // https://gist.github.com/1930440

    /**
     * @param {Object} element
     * @param {string} type
     * @param {function(...[*])} handler
     * @param {boolean=} oldSchool
     * @param {boolean=} useCapture
     */
    var register_event = function(element, type, handler, oldSchool, useCapture) {
        if (!element) {
            console.error('No valid element provided to register_event');
            return;
        }

        if (element.addEventListener && !oldSchool) {
            element.addEventListener(type, handler, !!useCapture);
        } else {
            var ontype = 'on' + type;
            var old_handler = element[ontype]; // can be undefined
            element[ontype] = makeHandler(element, handler, old_handler);
        }
    };

    function makeHandler(element, new_handler, old_handlers) {
        var handler = function(event) {
            event = event || fixEvent(window.event);

            // this basically happens in firefox whenever another script
            // overwrites the onload callback and doesn't pass the event
            // object to previously defined callbacks.  All the browsers
            // that don't define window.event implement addEventListener
            // so the dom_loaded handler will still be fired as usual.
            if (!event) {
                return undefined;
            }

            var ret = true;
            var old_result, new_result;

            if (_.isFunction(old_handlers)) {
                old_result = old_handlers(event);
            }
            new_result = new_handler.call(element, event);

            if ((false === old_result) || (false === new_result)) {
                ret = false;
            }

            return ret;
        };

        return handler;
    }

    function fixEvent(event) {
        if (event) {
            event.preventDefault = fixEvent.preventDefault;
            event.stopPropagation = fixEvent.stopPropagation;
        }
        return event;
    }
    fixEvent.preventDefault = function() {
        this.returnValue = false;
    };
    fixEvent.stopPropagation = function() {
        this.cancelBubble = true;
    };

    return register_event;
})();

_.register_hash_event = function(callback) {
    _.register_event(window,'hashchange',callback);
};

// 客户端基本属性
_.info = {
  domain(referrer) {
    const split = referrer.split('/');
    if (split.length >= 3) {
        return split[2];
    }
    return '';
  },
  // 设备型号
  deviceModel() {
    let deviceModel = '';
    if(device.android()) {
      const sss = win.navigator.userAgent.split(";");  
      const i = sss.indexOf("Build/");  
      if (i > -1) {
        deviceModel = sss[i].substring(0, sss[i].indexOf("Build/"));  
      }
    } else if(device.ios()) {
      if(device.iphone()) {
        deviceModel = 'iPhone';
      }
    }
    return deviceModel;
  },
  properties() {
    const windowsOs = {
     '5.0': 'Win2000',
     '5.1': 'WinXP',
     '5.2': 'Win2003',
     '6.0': 'WindowsVista',
     '6.1': 'Win7',
     '6.2': 'Win8',
     '6.3': 'Win8.1',
     '10.0': 'Win10' 
    };
    const devicePlatform = device.type;
    const deviceModel = _.trim(this.deviceModel());
    const isWindows = device.windows();
    let deviceOsVersion = detector.os.name + ' ' +detector.os.fullVersion;
    if(isWindows) {
      if(windowsOs[detector.os.fullVersion]) {
        deviceOsVersion = windowsOs[detector.os.fullVersion];
      }
    }
    return {
      // 设备型号
      deviceModel: deviceModel,
      // 操作系统
      deviceOs: detector.os.name,
      // 操作系统版本
      deviceOsVersion: deviceOsVersion,
      // 设备平台
      devicePlatform: devicePlatform,
      // 浏览器名称
      browser: detector.browser.name,
      // 浏览器版本
      browserVersion: detector.browser.fullVersion,
      // 页面标题
      title: win.document.title || '',
      // 页面路径
      urlPath: win.location.pathname || '',
      // 页面url
      currentUrl: win.location.href,
      // 域名
      currentDomain: this.domain(win.location.href),
      // referrer 数据来源
      referrer: win.document.referrer,
      // referrer 域名
      referringDomain: this.domain(win.document.referrer),
      // 本地语言
      language: win.navigator.language || '',
      // 客户端分辨率 width
      screenWidth: win.screen.width,
      // 客户端分辨率 height
      screenHeight: win.screen.height
    };
  }
};

// 消息订阅/推送
_.innerEvent = {
  /**
   * 订阅
   *  */ 
  on: function(key, fn) {
      if(!this._list) {
          this._list = {};
      }
      if (!this._list[key]) {
          this._list[key] = [];
      }
      this._list[key].push(fn);
  },
  off: function(key) {
      if(!this._list) {
          this._list = {};
      }
      if (!this._list[key]) {
          return;
      }else{
          delete this._list[key];
      }
  },
  /**
   * 推送
   */
  trigger: function() {
      var args = Array.prototype.slice.call(arguments);
      var key = args[0];
      var arrFn = this._list && this._list[key];
      if (!arrFn || arrFn.length === 0) {
          return;
      }
      for (var i = 0; i < arrFn.length; i++) {
          if( typeof arrFn[i] == 'function') {
              arrFn[i].apply(this, args);
          }
      }
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
        return val; 
      }else{
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
      if (CONFIG.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
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
      if (CONFIG.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
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

export {_, console};