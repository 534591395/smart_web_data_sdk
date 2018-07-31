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
    // 初始化时间(事件相关)
    this['local_storage'].register_once({
      updatedTime: 0,
      sessionStartTime: 0
    });
    // 将当前的referrer保存到本地缓存
    this['local_storage'].register({
      sessionReferrer: document.referrer
    });
    
    let mark_page_url = location.href;
    // 单页面触发PV事件时，设置 referrer
    _.innerEvent.on('singlePage:change', (eventName, urlParams) => {
      this['local_storage'].register({
        sessionReferrer: mark_page_url
      });
      mark_page_url = location.href;
    });
  }
  /**
   *
   * 判断是否为其它渠道
   */
  _check_channel() {
    const referrer = this.instance.get_property('sessionReferrer');
    let is_other_channel = false;
    // 若本地缓存的referrer 的host跟当前页不一样，那么可以确定是其它渠道进来的
    if (_.getHost(referrer) !== window.location.host) {
      is_other_channel = true;
    }
    return is_other_channel;
  }
  /**
   * TODO
   * 判断指定事件是否被禁止上报
   * @param {String} event_name
   * @returns {Boolean} 
   */
  _event_is_disabled(event_name) {
    return false;
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
    /*
     为了便于绘制用户事件发生轨迹图，区分会话close和最后一次事件触发时间的顺序，会话关闭时间需要做些微调
     1. 如果本地拿到了上次（非会话事件）事件的触发时间，time = this.instance.get_property('LASTEVENT').time + 1;
     2. 如果未拿到，time = new Date().getTime() - 1;
    */
    let time = new Date().getTime() - 1;
    const sessionStartTime = this.instance.get_property('sessionStartTime');
    const LASTEVENT = this.instance.get_property('LASTEVENT');
    if (LASTEVENT && LASTEVENT.time) {
      time = LASTEVENT.time + 1;
    }
    const sessionTotalLength = time - sessionStartTime;
    if (sessionTotalLength >= 0) {
      this.track('smart_session_close', {
      sessionCloseTime: time,
      sessionTotalLength: sessionTotalLength
    });
   }
  }
  /**
   * 判断会话重新开启
   * 判断条件：会话首次开始、指定的一段时间内用户无事件操作、其它渠道进来
  */
  _session(callback) {
    const session_start_time = 1 * this.instance.get_property('sessionStartTime') / 1000;
    const updated_time = 1 * this.instance.get_property('updatedTime') / 1000;
    const now_date_time_ms = new Date().getTime();
    const now_date_time_se = 1 * now_date_time_ms / 1000;
    // 其它渠道判断
    const other_channel_Bool = this._check_channel();
    //会话结束判断
    if (
      session_start_time === 0 ||
      now_date_time_se > updated_time + 60 * this.instance._get_config('session_interval_mins') ||
      other_channel_Bool
    ) {
      // 当会话首次开始时，不用发送会话关闭事件
      if (session_start_time === 0) {
        // 新打开一个会话
        this._start_new_session();
      } else {
        this._close_cur_session();
        this._start_new_session();
      }
    }
    // 更新本地的最后事件操作时间
    this['local_storage'].register({
      updatedTime: now_date_time_ms
    });
    // 执行回调方法
    if (_.isFunction(callback)) {
      callback();
    }
  }
  /**
   * 用户注册
   * @param {String} user_id 
   */
  _signup(user_id) {
    // 默认是空值,若有值则调用退出
    const anonymous_id = this.instance.get_property('userId');
    if (anonymous_id !== user_id) {
      if (anonymous_id) {
        this.logout();
      }
      this.track('smart_u_signup', {
        anonymousId: anonymous_id,
        newUserId: user_id
      });
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
    // 若事件id为会话关闭，需要删除传入的自定义属性
    if (event_name === 'smart_session_close') {
      time = properties.sessionCloseTime;
      delete user_set_properties['sessionCloseTime'];
      delete user_set_properties['sessionTotalLength'];
    }



    // 设置通用的事件属性
    user_set_properties = _.extend({}, this.instance.get_property('superProperties'), user_set_properties);
    
    // 上报数据
    let data = {
      dataType: data_type,
      userId: this.instance.get_property('userId'),
      // sdk类型 （js，小程序、安卓、IOS、server、pc）
      sdkType: 'js',
      sdkVersion: CONFIG.LIB_VERSION,
      // 事件名称
      eventId: event_name,
      // 事件触发时间
      time: time,
      // 用户首次访问时间
      persistedTime: this.instance.get_property('persistedTime'),
      // 客户端唯一凭证(设备凭证)
      deviceId: this.instance.get_device_id(),
      // 页面打开场景, 默认 Browser
      pageOpenScene: 'Browser',
      // 应用凭证
      token: this.instance._get_config('token'),
      costTime: costTime,
      // 当前关闭的会话时长
      sessionTotalLength: properties.sessionTotalLength,
      // 当前会话id
      sessionUuid: this.instance.get_property('sessionUuid'),
      // 事件自定义属性
      attributes: user_set_properties
    };
    // 合并客户端信息
    data = _.extend({}, data, _.info.properties());

    //只有已访问页面后，sessionReferrer 重置
    //如果不是内置事件，那么 sessionReferrer 重置
    //如果是'da_activate'，那么 sessionReferrer 重置
    //解决referrer 当是外链时，此时触发自定义事件，引起重启一个session问题。
    if(data_type === BUSSINESS_EVENT_TYPE) {
      // 其它渠道
      if(this._check_channel()) {
        this['local_storage'].register({
            sessionReferrer: document.location.href
        });
      }
    }
    if(!this.instance._get_config('SPA').is) {
      if( ['smart_activate','smart_session_close'].indexOf(event_name) > 0 ) {
        this['local_storage'].register({
            sessionReferrer: document.location.href
        });
      }
    }

    // 当启动单页面后，切换页面，refer为空，此时做处理
    if (this.instance._get_config('SPA').is) {
      const sessionReferrer = this.instance.get_property('sessionReferrer');
      if (sessionReferrer !== data['referrer']) {
        data['referrer'] = sessionReferrer;
        data['referringDomain'] = _.info.domain(sessionReferrer);
      }
    }

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

    // 当触发的事件不是这些事件(smart_session_start,smart_session_close,smart_activate)时，触发检测 session 方法
    if(['smart_session_start', 'smart_session_close', 'smart_activate'].indexOf(event_name) === -1) {
      this._session();
    }

    // 保存最后一次用户触发事件（除了会话事件以外）的事件id以及时间，通过这个时间确定会话关闭时的时间
    if (['smart_session_start', 'smart_session_close'].indexOf(event_name) === -1) {
      this['local_storage'].register({
        LASTEVENT: {
          eventId: event_name,
          time: time
        }
      });
    }    
  }
  /**
   * 用户登录和注册时调用
   * @param {String} user_id 
   */
  login(user_id) {
    this._signup(user_id);
    this['local_storage'].register({'userId': user_id});
    this.track('smart_u_login');
  }
  // 清除本地用户信息，退出用户（选则调用）
  logout() {
    this['local_storage'].unregister('userId');
    this.track('smart_u_logout');
  }
}

export default EVENT_TRACK;
