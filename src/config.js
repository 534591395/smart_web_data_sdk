// 默认配置
const DEFAULT_CONFIG = {
  // 上报服务器域名配置
  'api_host': 'localhost:3301',
  // debug启动配置
  'debug': false,
  // 本地存储配置
  'local_storage': {
    // 存储方式  localStorage || cookie
    'type': 'localStorage',
    // 存储名称
    'name': ''
  },
  // cookie存储时，跨主域名存储配置
  'cross_subdomain_cookie': false,
  // 初始化sdk时触发的方法
  'loaded': function() {},
  // 上报数据实现形式  ajax img
  'get_type': 'img',
  // 单页面应用配置
  'SPA': {
    // 是SPA配置
    'is': false,
    // SPA 实现类型，hash || history
    'type': 'hash'
  },
  // PV指标自动触发配置
  'pageview': true,
  // 上报数据前，每个字段长度截取配置，默认不截取
  'truncateLength': -1,
  // 会话超时时长，默认30分钟
  'session_interval_mins': 30
};


// 配置
const CONFIG = {
  DEBUG: false,
  LIB_VERSION: '0.1.0'
};

// 系统事件类型（事件分为：系统事件和业务事件）
const SYSTEM_EVENT_TYPE = 'se';

// 业务事件类型
const BUSSINESS_EVENT_TYPE = 'be';

// 系统事件列表
const SYSTEM_EVENT_LIST = [
  // 会话开始事件
  'smart_session_start',
  // 会话结束事件
  'smart_session_close',
  // PV事件
  'smart_pv',
  // 广告点击事件
  'smart_ad_click',
  // 用户首次访问网站事件
  'smart_activate',
  // A/B 测试事件
  'smart_abtest',
  // 异常错误事件
  'smart_error',
  // 用户注册事件
  'smart_u_signup',
  // 用户登录事件
  'smart_u_login',
  // 用户登出事件
  'smart_u_logout',
  // 用户属性设置事件
  'smart_u_property'
];

export default {
  CONFIG,
  DEFAULT_CONFIG,
  SYSTEM_EVENT_TYPE,
  BUSSINESS_EVENT_TYPE,
  SYSTEM_EVENT_LIST
};