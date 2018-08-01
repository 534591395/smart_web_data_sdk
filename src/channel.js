import {
  CHANNEL_PARAMS
} from './config'

import {_} from './utils'

class CHANNEL {
  constructor(instance) {
    this.instance = instance;
    // 渠道推广的参数信息
    this.channel_params = {};
  }
  // 转变参数
  _change() {

  }
  // 得到url上推广的参数信息
  _url_channel_params() {
    const channel_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term promotional_id'.split(' ');
    let val = '';
    const params = {};
    _.each(channel_keywords, function(key) {
      val = _.getQueryParam(document.URL, key);
      if (val) {
        params[key] = val;
      }
    });
    return params;
  }
  // 检测是否为渠道推广
  _check_chennel() {
    const params = this._url_channel_params();
    let is_channel = false;
    if (params.utm_source && params.utm_medium && params.utm_campaign) {
      is_channel = true;
    }
    return is_channel;
  }
  // 保存
  _save() {}
  // 检测是否要上报广告点击事件
  check_ad_click() {
    
  }
}

export default CHANNEL;