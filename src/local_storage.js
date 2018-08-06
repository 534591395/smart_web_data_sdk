import {_, console} from './utils';


class LOCAL_STORAGE {
  /**
   * 
   * @param {Object} config
   */
  constructor(config) {
    const local_storage = config['local_storage'];
    if (_.isObject(local_storage)) {
      this['name'] = local_storage['name'] || ('smart_' + config['token'] + '_sdk');
      let storage_type = local_storage['type'] || 'cookie';

      // 判断是否支持 localStorage
      const localStorage_supported = () => {
        let supported = true;
        try {
          let key = '__smartssupport__',
          val = 'smart_web_data_sdk';
          _.localStorage.set(key, val);
          if (_.localStorage.get(key) !== val) {
              supported = false;
          }
          _.localStorage.remove(key);
        } catch (error) {
          supported = false;
        }
        if (!supported) {
          console.error('localStorage 不支持，自动退回到cookie存储方式');
        }
        return supported;
      };

      if (storage_type === 'localStorage' && localStorage_supported()) {
        this['storage'] = _.localStorage;
      } else {
        this['storage'] = _.cookie;
      }
      
      this.load();
      this.update_config(local_storage);
      // TODO: upgrade
      this.upgrade();
      this.save();
    } else {
      console.error('local_storage配置设置错误');
    }
  }
  // 加载本地存储信息
  load() {
    const localData = this['storage'].parse(this['name']);
    if (localData) {
      this['props'] = _.extend({}, localData);
    }
  }
  // 更新配置信息
  update_config(localStorageConfig) {
    // 到期时间(cookie存储设置有效)
    this.default_expiry = this.expire_days = localStorageConfig['cookie_expiration'];
    this.set_disabled(localStorageConfig['disable']);
    this.set_cross_subdomain(localStorageConfig['cross_subdomain_cookie']);
    this.set_secure(localStorageConfig['secure_cookie']);
  }
  // 设置关闭本地保存操作，设置为关闭后，本地数据移除
  set_disabled(disabled) {
    this.disabled = disabled;
    if (this.disabled) {
      this.remove();
    }
  }
  // 移除本地数据
  remove() {
    // cookie存储时，移除二级域以及子域下的cookie,此时参数有两个
    this.storage.remove(this.name, false);
    this.storage.remove(this.name, true);
  }
  // 清除存储的数据
  clear() {
    this.remove();
    this['props'] = {};
  }
  /**
   * 跨子域设置,cookie存储方式下有效
   * @param {Boolean} cross_subdomain 
   */
  set_cross_subdomain(cross_subdomain) {
    if (cross_subdomain !== this.cross_subdomain) {
      this.cross_subdomain = cross_subdomain;
      this.remove();
      this.save();
    }
  }
  /**
   * cookie存储方式下有效
   * cookie存储时，采用安全的方式存储数据，调用该方法后，重新保存数据
   * 当secure属性设置为true时，cookie只有在https协议下才能上传到服务器，
   * 而在http协议下是没法上传的，所以也不会被窃听
   * @param {Boolean} secure 
   */
  set_secure(secure) {
    if (secure !== this.secure) {
      this.secure = secure ? true : false;
      this.remove();
      this.save();
    }
  }
  // sdk升级，旧的sdk存储数据移到新的sdk存储数据中，然后删除旧的存储数据（暂不实现）
  // 存储方式改变，改为cookie切换到 localStorage
  upgrade(config) {
    let old_cookie;
    if (this.storage === _.localStorage) {
      old_cookie = _.cookie.parse(this.name);
      _.cookie.remove(this.name);
      _.cookie.remove(this.name, true);

      if (old_cookie) {
        this.register_once(old_cookie);
      }
    }
  }
  // 数据保存到本地
  save() {
    // disabled配置为true, 数据不保存到本地
    if (this.disabled) {
      return;
    }
    this.storage.set(
      this['name'],
      _.JSONEncode(this['props']),
      this.expire_days,
      this.cross_subdomain,
      this.secure
    );
  }
  /**
   * 缓存指定的数据，同时将该数据保存到本地
   * @param {Object} props 
   * @param {Number} days
   * @returns {Boolean} 返回true表示成功
   */
  register(props, days) {
    if (_.isObject(props)) {
      this.expire_days = ( typeof days === 'undefined' ) ? this.default_expiry : days;
      _.extend(this['props'], props);
      this.save();
      return true;
    }
    return false;
  }
  /**
   * 只缓存一次指定的数据，下次设置该数据时不会覆盖前一次数据
   * 若想更新已设置的属性值，那么default_value参数值要等于本地缓存数据中需重置的属性的值(默认值)
   * this['props'][prop] === default_value   prop为需更新的属性
   * @param {Object} props
   * @param {*} default_value
   * @param {Number} days
   * @returns {Boolean} 返回true表示成功
   */
  register_once(props, default_value, days) {
    if (_.isObject(props)) {
      if (typeof default_value === 'undefined') {
        default_value = 'None';
      }
      this.expire_days = ( typeof days === 'undefined' ) ? this.default_expiry : days;

      _.each(props, function(val, prop) {
        if (!this['props'][prop] || this['props'][prop] === default_value) {
          this['props'][prop] = val;
        }
      }, this);

      this.save();
      return true;
    }
    return false;
  }
  /**
   * 移除指定的缓存数据，同时也清除本地的对应数据
   * @param {string} prop
   */
  unregister(prop) {
    if (prop in this['props']) {
      delete this['props'][prop];
      this.save();
    }
  }
  /**
   * 设置一个事件计时器，记录用户触发指定事件需要的时间，同时保存到本地
   * @param {String} event_name 该计时器的名称
   * @param {Date} timestamp 该计时器开始时间戳
   */
  set_event_timer(event_name, timestamp) {
    const timers = this['props']['costTime'] || {};
    timers[event_name] = timestamp;
    this['props']['costTime'] = timers;
    this.save();
  }
  /**
   * 移除指定计时器，同时将本地存储的该计时器信息清除
   * @param {String} event_name
   * @returns {Date} 返回移除该计时器的时间戳
   */
  remove_event_timer(event_name) {
    const timers = this['props']['costTime'] || {};
    const timestamp = timers[event_name];
    if (!_.isUndefined(timestamp)) {
      delete this['props']['costTime'][event_name];
      this.save();
    }
    return timestamp;
  }
};

export default LOCAL_STORAGE;