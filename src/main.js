import {
  CONFIG,
  DEFAULT_CONFIG,
  SYSTEM_EVENT_TYPE,
  BUSSINESS_EVENT_TYPE,
  SYSTEM_EVENT_LIST
} from './config'

import {_, console} from './utils';

// 用户属性追踪
import USER_TRACK from './user_track'
// 用户事件追踪
import EVENT_TRACK from './event_track'
// 本地存储
import LOCAL_STORAGE from './local_storage'

class SMART {
  /**
   * 
   * @param {String} token 上报数据凭证
   * @param {Object} config sdk客户端配置
   */
  constructor(token, config) {
    this['__loaded'] = true;
    this['config'] = {};
    this._set_config(_.extend({}, DEFAULT_CONFIG, CONFIG, config, {'token': token}));
  }
  /**
   * 设置配置
   * @param {Object} config 
   */
  _set_config(config) {
    if (_.isObject(config)) {
      _.extend(this['config'], config);
      CONFIG.DEBUG = CONFIG.DEBUG || this._get_config('debug');
    }
  }
  /**
   * 获取某个配置
   * @param {String} prop_name
   * @returns {*} 
   */
  _get_config(prop_name) {
    return this['config'][prop_name];
  }
}

export default SMART;