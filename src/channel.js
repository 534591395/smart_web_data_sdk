import {
  CHANNEL_PARAMS
} from './config'

import {_} from './utils'

class CHANNEL {
  constructor(instance) {
    this.instance = instance;
    // 渠道推广的参数信息
    this.channel_params = {};
    this.cookie_name = 'smart_' + this.instance._get_config('token') + '_c';
    this._set_channel_params();
  }
  // 转变参数(TODO)
  _change() {

  }
  // 从url 或 本地cookie 拿取推广信息
  _set_channel_params() {
    // 从url上拿取，此时还需保存到本地cookie
    if (this._check_chennel()) {
      this.channel_params = this._url_channel_params();
      this._save();
    } else {
     // 从本地cookie拿取
     const cookie = _.cookie.get(this.cookie_name);
     if (cookie) {
      this.channel_params = _.JSONDecode(cookie);
     }
    }
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
    if (params.utm_source && params.utm_medium && params.utm_campaign && params.promotional_id) {
      is_channel = true;
    }
    return is_channel;
  }
  // 将推广参数值保存到客户端本地的cookie，30天后失效
  _save() {
    if (this._check_chennel()) {
      _.cookie.set(
        this.cookie_name, 
        _.JSONEncode(this.channel_params), 
        30, 
        this.instance._get_config('local_storage').cross_subdomain_cookie
      );
    }
  }
  // 检测是否要上报广告点击事件
  // 条件： 1. 必须是渠道推广；2. 必须有 referrer；3. 当前打开的页面url必须是对外推广的url（有短链和长链）, 表现为当前url上的参数无 t_re(turn_redirect) 字段值；
  // 其它说明：一般情况下对外推广的链接是短链（不一定跟落地页域名一致），但有些渠道不支持，那么只能使用长链（落地页url+ 推广参数）
  check_ad_click() {
    let is_ad_click = false;
    const t_re =  _.getQueryParam(document.URL, 't_re');
    if (this._check_chennel()) {
      if (document.referrer && !t_re) {
        is_ad_click = true;
      }
    }
    return is_ad_click;
  }
  // 返回参数
  get_channel_params() {
    this._set_channel_params();
    const params = {
      utmSource: this.channel_params.utm_source,
      utmMedium: this.channel_params.utm_medium,
      promotionalID: this.channel_params.promotional_id,
      utmCampaign: this.channel_params.utm_campaign,
      utmContent: this.channel_params.utm_content,
      utmTerm: this.channel_params.utm_term
    };
    return _.deleteEmptyProperty(params);
  }
}

export default CHANNEL;