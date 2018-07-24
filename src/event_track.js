import {
  CONFIG,
  DEFAULT_CONFIG,
  SYSTEM_EVENT_TYPE,
  BUSSINESS_EVENT_TYPE,
  SYSTEM_EVENT_OBJECT
} from './config'

import {_, console} from './utils'

class EVENT_TRACK {
  constructor(instance) {
    this.instance = instance;
    this['local_storage'] = this.instance['local_storage'];
    this['get_property'] = this.instance['get_property'];
    this['get_device_id'] = this.instance['get_device_id'];
    this['_get_config'] = this.instance['_get_config'];
    this['_set_config'] = this.instance['_set_config'];
    // 初始化时间
    this['local_storage'].register_once({
      updatedTime: 0,
      sessionStartTime: 0
    });
  }
  /**
   * TODO
   * 判断是否为其它渠道
   */
  _check_referer() {}
  /**
   * TODO
   * 判断指定事件是否被禁止上报
   * @param {String} event_name
   * @returns {Boolean} 
   */
  _event_is_disabled(event_name) {
    return true;
  }
  /**
   * 打开新会话
   */
  _start_new_session() {
    this['local_storage'].register({
      sessionUuid: _.UUID(),
      sessionStartTime: new Date().getTime()
    });
    this.track('smart_session_start');
  }
  /**
   * TODO
   * 关闭当前会话
   */
  _close_cur_session() {

  }
  /**
   * 判断会话重新开启
   * 判断条件：会话首次开始、指定的一段时间内用户无事件操作、其它渠道进来
  */
  _session(callback) {
    const sessionStartTime = 1 * this.get_property('sessionStartTime') / 1000;
    const updatedTime = 1 * this.get_property('updatedTime') / 1000;
    const nowDateTimeMs = new Date().getTime();
    const nowDateTimeSe = 1 * nowDateTimeMs / 1000;
    // 其它渠道判断
    const otherWBool = !this._check_referer();
    //会话结束判断
    if (
      sessionStartTime === 0 ||
      nowDateTimeSe > updatedTime + 60 * this._get_config('session_interval_mins') ||
      otherWBool
    ) {
      // 当会话首次开始时，不用发送会话关闭事件
      if (sessionStartTime === 0) {
        // 新打开一个会话
        this._start_new_session();
      } else {
        this._close_cur_session();
        this._start_new_session();
      }
    }
    // 更新本地的最后事件操作时间
    this['local_storage'].register({
      updatedTime: nowDateTimeMs
    });
    // 执行回调方法
    if (_.isFunction(callback)) {
      callback();
    }
  }
  /**
   * 设置一个指定事件的耗时监听器
   * @param {String} event_name
   */
  time_event(event_name) {
    if (_.isUndefined(event_name)) {
      console.error('事件耗时监听器需要一个事件名称');
      return;
    }
    // 被禁止的事件，无需监听
    if (this._event_is_disabled(event_name)) {
      return;
    }
    this['local_storage'].set_event_timer(event_name, new Date().getTime());
  }
  /**
   * 发送PV事件，在此之前检测session
   * @param {Object} properties  pv属性
   * @param {*} callback 
   */
  track_pv(properties, callback) {
    this._session(() => {
      this.track('smart_pv', _.extend({}, properties), callback);
    });
  }
  /**
   * 追踪事件（上报用户事件触发数据）
   * @param {String} event_name 事件名称（必须）
   * @param {Object} properties 事件属性
   * @param {Function} callback 上报后的回调方法
   * @param {String} event_type 自定义事件类型
   * @returns {Object} track_data 上报的数据
   */
  track(event_name, properties, callback, event_type) {
    if (_.isUndefined(event_name)) {
      console.error('上报数据需要一个事件名称');
      return;
    }
    if (!_.isFunction(callback)) {
      callback = function() {};
    }
    if (this._event_is_disabled(event_name)) {
      callback(0);
      return;
    }
    // 重新在本地取数据读取到缓存
    this['local_storage'].load();
    // 事件属性
    properties = properties || {};
    // 标记：传入的属性另存一份
    let user_set_properties = _.JSONDecode(_.JSONEncode(properties)) || {};
    let costTime;
    // 移除该事件的耗时监听器，获取设置监听器的时间戳，计算耗时
    const start_listen_timestamp = this['local_storage'].remove_event_timer(event_name);
    if (!_.isUndefined(start_listen_timestamp)) {
      costTime = new Date().getTime() - start_listen_timestamp;
    }
    // 事件类型设置
    let data_type = BUSSINESS_EVENT_TYPE;
    // 事件类型设置为传入了自定义事件类型
    if (event_type) {
      data_type = event_type;
    } else
    // 如果是内置事件,事件类型重新设置
    if (SYSTEM_EVENT_OBJECT[event_name]) {
      data_type = SYSTEM_EVENT_OBJECT[event_name].data_type;
    }

    // 事件触发时间
    let time = new Date().getTime();
    // 会话有时间差
    // 触发的事件若是会话结束，触发时间要重新设置
    if (event_name === 'smart_session_close') {
      
    }
    
    // 上报数据
    let data = {
      dataType: data_type,
      userId: this.get_property('user_id'),
      // sdk类型 （js，小程序、安卓、IOS、server、pc）
      sdkType: 'js',
      sdkVersion: CONFIG.LIB_VERSION,
      // 事件名称
      eventId: event_name,
      // 事件触发时间
      time: time,
      // 用户首次访问时间
      persistedTime: this.get_property('persistedTime'),
      // 客户端唯一凭证(设备凭证)
      deviceId: this.get_device_id(),
      // 页面打开场景, 默认 web
      pageOpenScene: 'web',
      // 应用凭证
      token: this._get_config('token'),
      costTime: costTime
    };
    // 合并客户端信息
    data = Object.assign({}, data, _.info.properties());

    // 上报数据对象字段截取
    const truncateLength = this._get_config('truncateLength');
    if (_.isNumber(truncateLength) && truncateLength > 0) {
      data = _.truncate(data, truncateLength);
    }
    const callback_fn = (response) => {
      callback(response, data);
    };
    const url = this._get_config('api_host') + '/track/';
    const track_type = this._get_config('track_type');
    if (track_type === 'img') {
      url += 'track.gif';
    }
    _.sendRequest(
      url, 
      track_type, 
      { data: _.base64Encode(_.JSONEncode(truncated_data)), token: this._get_config('token') }, 
      callback_fn
    );
  }
}

export default EVENT_TRACK;
