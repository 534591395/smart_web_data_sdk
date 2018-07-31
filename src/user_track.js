import {
  PEOPLE_RESERVED_PROPERTY,
  SYSTEM_EVENT_TYPE,
  PEOPLE_PROPERTY_ID
} from './config'

import {_, console} from './utils'

class USER_TRACK {
  constructor(instance) {
    this.instance = instance;
    this['local_storage'] = this.instance['local_storage'];
  }
  /**
   * 检测设置的属性是否为系统保留属性
   * @param {String} prop 
   */
  _is_reserved_property(prop) {
    return PEOPLE_RESERVED_PROPERTY.indexOf('prop') > -1;
  }
  /**
   * 上报用户属性数据
   * @param {Object} properties 
   * @param {Function} callback 
   */
  _send_request(properties, callback) {
    if (!_.isFunction(callback)) {
      callback = function() {};
    }

    properties = properties || {};
    
    let data = {
      dataType: SYSTEM_EVENT_TYPE,
      // 客户端唯一凭证(设备凭证)
      deviceId: this.instance.get_device_id(),
      userId: this.instance.get_property('user_id'),
      // 上报时间
      time: new Date().getTime(),
      // sdk类型 （js，小程序、安卓、IOS、server、pc）
      sdkType: 'js',
      // 属性事件id
      eventId: PEOPLE_PROPERTY_ID,
      // 用户首次访问时间
      persistedTime: this.instance.get_property('persistedTime'),
      // 页面打开场景, 默认 Browser
      pageOpenScene: 'Browser',
      // 自定义用户属性
      attributes: properties
    };

    // 上报数据对象字段截取
    const truncateLength = this.instance._get_config('truncateLength');
    let truncated_data = data;
    if (_.isNumber(truncateLength) && truncateLength > 0) {
      truncated_data = _.truncate(data, truncateLength);
    }

    console.log('上报的数据（截取后）:', truncated_data); 

    const callback_fn = (response) => {
      callback(response, data);
    };
    let url = this.instance._get_config('track_url');
    
    // 数据上报方式
    const track_type = this.instance._get_config('track_type');
    if (track_type === 'img') {
      url += 'track.gif';
    }
    _.sendRequest(
      url, 
      track_type, 
      { data: _.base64Encode(_.JSONEncode(truncated_data)), token: this.instance._get_config('token') }, 
      callback_fn
    );
  }
  /**
   * 设置用户属性
   * @param {*} prop 
   * @param {*} to 
   * @param {*} callback 
   */
  set(prop, to, callback) {
    let set_props = {};
    if (_.isObject(prop)) {
      _.each(prop, (v ,k) => {
        // 不是系统保留属性
        if (!this._is_reserved_property(k)) {
          set_props[k] = v;
        }
      });
      callback = to;
    } else {
      set_props[prop] = to;
    }
    return this._send_request(set_props, callback);
  }
}

export default USER_TRACK;