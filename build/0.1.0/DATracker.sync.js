(function () {
    'use strict';

    // 默认配置
    const DEFAULT_CONFIG = {
      // 上报服务器域名配置
      'api_host': 'localhost:3301',
      // debug启动配置
      'debug': false,
      // 本地存储配置
      'local_storage': {
        // 存储方式  localStorage || cookie
        'type': 'cookie',
        // 存储名称
        'name': '',
        // 关闭存储功能
        'disable': false,
        // cookie存储时，采用安全的存储方式，即：
        //当secure属性设置为true时，cookie只有在https协议下才能上传到服务器，而在http协议下是没法上传的，所以也不会被窃听
        'secure_cookie': false,
        // cookie存储时，跨主域名存储配置
        'cross_subdomain_cookie': true,
        // cookie方法存储时，配置保存过期时间
        'cookie_expiration': 1000
      },
      // 初始化sdk时触发的方法
      'loaded': function () {},
      // 上报数据实现形式  post, get, img
      'track_type': 'img',
      // 单页面应用配置
      'SPA': {
        // 开启SPA配置
        'is': false,
        // SPA 实现类型，hash || history
        'mode': 'hash'
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
    const SYSTEM_EVENT_OBJECT = {
      // 会话开始事件
      'smart_session_start': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // 会话结束事件
      'smart_session_close': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // PV事件
      'smart_pv': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // 广告点击事件
      'smart_ad_click': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // 用户首次访问网站事件
      'smart_activate': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // A/B 测试事件
      'smart_abtest': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // 异常错误事件
      'smart_error': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // 用户注册事件
      'smart_u_signup': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // 用户登录事件
      'smart_u_login': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // 用户登出事件
      'smart_u_logout': {
        'data_type': SYSTEM_EVENT_TYPE
      },
      // 用户属性设置事件
      'smart_u_property': {
        'data_type': SYSTEM_EVENT_TYPE
      }
    };

    // People类系统保留属性，用户设置这些属性将无法成功
    const PEOPLE_RESERVED_PROPERTY = ['$deviceUdid', '$toekn'];

    // People类属性事件id，全局唯一
    const PEOPLE_PROPERTY_ID = 'smart_user_property';

    var NA_VERSION = "-1";
    var external = win.external;
    var userAgent = win.navigator.userAgent || "";
    var appVersion = win.navigator.appVersion || "";
    var vendor = win.navigator.vendor || "";
    var detector = {};

    var re_msie = /\b(?:msie |ie |trident\/[0-9].*rv[ :])([0-9.]+)/;
    var re_blackberry_10 = /\bbb10\b.+?\bversion\/([\d.]+)/;
    var re_blackberry_6_7 = /\bblackberry\b.+\bversion\/([\d.]+)/;
    var re_blackberry_4_5 = /\bblackberry\d+\/([\d.]+)/;

    // http://zakwu.me/2015/12/15/an-zhuo-shou-ji-uashou-ji/ 参考
    // 硬件设备信息识别表达式。
    // 使用数组可以按优先级排序。
    var DEVICES = [["nokia", function (ua) {
        // 不能将两个表达式合并，因为可能出现 "nokia; nokia 960"
        // 这种情况下会优先识别出 nokia/-1
        if (ua.indexOf("nokia ") !== -1) {
            return (/\bnokia ([0-9]+)?/
            );
        } else {
            return (/\bnokia([a-z0-9]+)?/
            );
        }
    }],
    // 三星有 Android 和 WP 设备。
    ["samsung", function (ua) {
        if (ua.indexOf("samsung") !== -1) {
            return (/\bsamsung(?:[ \-](?:sgh|gt|sm))?-([a-z0-9]+)/
            );
        } else {
            return (/\b(?:sgh|sch|gt|sm)-([a-z0-9]+)/
            );
        }
    }], ["wp", function (ua) {
        return ua.indexOf("windows phone ") !== -1 || ua.indexOf("xblwp") !== -1 || ua.indexOf("zunewp") !== -1 || ua.indexOf("windows ce") !== -1;
    }], ["pc", "windows"], ["ipad", "ipad"],
    // ipod 规则应置于 iphone 之前。
    ["ipod", "ipod"], ["iphone", /\biphone\b|\biph(\d)/], ["mac", "macintosh"],
    // 小米
    ["mi", /\bmi[ \-]?([a-z0-9 ]+(?= build|\)))/],
    // 红米
    ["hongmi", /\bhm\b|redmi[ \-]?([a-z0-9]+)/], ["aliyun", /\baliyunos\b(?:[\-](\d+))?/], ["meizu", function (ua) {
        return ua.indexOf("meizu") >= 0 ? /\bmeizu[\/ ]([a-z0-9]+)\b/ : /\bm([0-9cx]{1,4})\b/;
    }], ["nexus", /\bnexus ([0-9s.]+)/], ["huawei", function (ua) {
        var re_mediapad = /\bmediapad (.+?)(?= build\/huaweimediapad\b)/;
        if (ua.indexOf("huawei-huawei") !== -1) {
            return (/\bhuawei\-huawei\-([a-z0-9\-]+)/
            );
        } else if (re_mediapad.test(ua)) {
            return re_mediapad;
        } else {
            return (/\bhuawei[ _\-]?([a-z0-9]+)/
            );
        }
    }], ["lenovo", function (ua) {
        if (ua.indexOf("lenovo-lenovo") !== -1) {
            return (/\blenovo\-lenovo[ \-]([a-z0-9]+)/
            );
        } else {
            return (/\blenovo[ \-]?([a-z0-9]+)/
            );
        }
    }],
    // 中兴
    ["zte", function (ua) {
        if (/\bzte\-[tu]/.test(ua)) {
            return (/\bzte-[tu][ _\-]?([a-su-z0-9\+]+)/
            );
        } else {
            return (/\bzte[ _\-]?([a-su-z0-9\+]+)/
            );
        }
    }],
    // 步步高
    ["vivo", /\bvivo(?: ([a-z0-9]+))?/], ["htc", function (ua) {
        if (/\bhtc[a-z0-9 _\-]+(?= build\b)/.test(ua)) {
            return (/\bhtc[ _\-]?([a-z0-9 ]+(?= build))/
            );
        } else {
            return (/\bhtc[ _\-]?([a-z0-9 ]+)/
            );
        }
    }], ["oppo", /\boppo[_]([a-z0-9]+)/], ["konka", /\bkonka[_\-]([a-z0-9]+)/], ["sonyericsson", /\bmt([a-z0-9]+)/], ["coolpad", /\bcoolpad[_ ]?([a-z0-9]+)/], ["lg", /\blg[\-]([a-z0-9]+)/], ["android", /\bandroid\b|\badr\b/], ["blackberry", function (ua) {
        if (ua.indexOf("blackberry") >= 0) {
            return (/\bblackberry\s?(\d+)/
            );
        }
        return "bb10";
    }]];
    // 操作系统信息识别表达式
    var OS = [["wp", function (ua) {
        if (ua.indexOf("windows phone ") !== -1) {
            return (/\bwindows phone (?:os )?([0-9.]+)/
            );
        } else if (ua.indexOf("xblwp") !== -1) {
            return (/\bxblwp([0-9.]+)/
            );
        } else if (ua.indexOf("zunewp") !== -1) {
            return (/\bzunewp([0-9.]+)/
            );
        }
        return "windows phone";
    }], ["windows", /\bwindows nt ([0-9.]+)/], ["macosx", /\bmac os x ([0-9._]+)/], ["iOS", function (ua) {
        if (/\bcpu(?: iphone)? os /.test(ua)) {
            return (/\bcpu(?: iphone)? os ([0-9._]+)/
            );
        } else if (ua.indexOf("iph os ") !== -1) {
            return (/\biph os ([0-9_]+)/
            );
        } else {
            return (/\bios\b/
            );
        }
    }], ["yunos", /\baliyunos ([0-9.]+)/], ["Android", function (ua) {
        if (ua.indexOf("android") >= 0) {
            return (/\bandroid[ \/-]?([0-9.x]+)?/
            );
        } else if (ua.indexOf("adr") >= 0) {
            if (ua.indexOf("mqqbrowser") >= 0) {
                return (/\badr[ ]\(linux; u; ([0-9.]+)?/
                );
            } else {
                return (/\badr(?:[ ]([0-9.]+))?/
                );
            }
        }
        return "android";
        //return /\b(?:android|\badr)(?:[\/\- ](?:\(linux; u; )?)?([0-9.x]+)?/;
    }], ["chromeos", /\bcros i686 ([0-9.]+)/], ["linux", "linux"], ["windowsce", /\bwindows ce(?: ([0-9.]+))?/], ["symbian", /\bsymbian(?:os)?\/([0-9.]+)/], ["blackberry", function (ua) {
        var m = ua.match(re_blackberry_10) || ua.match(re_blackberry_6_7) || ua.match(re_blackberry_4_5);
        return m ? { version: m[1] } : "blackberry";
    }]];
    //浏览器内核
    var ENGINE = [["edgehtml", /edge\/([0-9.]+)/], ["trident", re_msie], ["blink", function () {
        return "chrome" in win && "CSS" in win && /\bapplewebkit[\/]?([0-9.+]+)/;
    }], ["webkit", /\bapplewebkit[\/]?([0-9.+]+)/], ["gecko", function (ua) {
        var match;
        if (match = ua.match(/\brv:([\d\w.]+).*\bgecko\/(\d+)/)) {
            return {
                version: match[1] + "." + match[2]
            };
        }
    }], ["presto", /\bpresto\/([0-9.]+)/], ["androidwebkit", /\bandroidwebkit\/([0-9.]+)/], ["coolpadwebkit", /\bcoolpadwebkit\/([0-9.]+)/], ["u2", /\bu2\/([0-9.]+)/], ["u3", /\bu3\/([0-9.]+)/]];
    var BROWSER = [
    // Microsoft Edge Browser, Default browser in Windows 10.
    ["edge", /edge\/([0-9.]+)/],
    // Sogou.
    ["sogou", function (ua) {
        if (ua.indexOf("sogoumobilebrowser") >= 0) {
            return (/sogoumobilebrowser\/([0-9.]+)/
            );
        } else if (ua.indexOf("sogoumse") >= 0) {
            return true;
        }
        return (/ se ([0-9.x]+)/
        );
    }],
    // TheWorld (世界之窗)
    // 由于裙带关系，TheWorld API 与 360 高度重合。
    // 只能通过 UA 和程序安装路径中的应用程序名来区分。
    // TheWorld 的 UA 比 360 更靠谱，所有将 TheWorld 的规则放置到 360 之前。
    ["theworld", function () {
        var x = checkTW360External("theworld");
        if (typeof x !== "undefined") {
            return x;
        }
        return "theworld";
    }],
    // 360SE, 360EE.
    ["360", function (ua) {
        var x = checkTW360External("360se");
        if (typeof x !== "undefined") {
            return x;
        }
        if (ua.indexOf("360 aphone browser") !== -1) {
            return (/\b360 aphone browser \(([^\)]+)\)/
            );
        }
        return (/\b360(?:se|ee|chrome|browser)\b/
        );
    }],
    // Maxthon
    ["maxthon", function () {
        try {
            if (external && (external.mxVersion || external.max_version)) {
                return {
                    version: external.mxVersion || external.max_version
                };
            }
        } catch (ex) {/* */
        }
        return (/\b(?:maxthon|mxbrowser)(?:[ \/]([0-9.]+))?/
        );
    }], ["micromessenger", /\bmicromessenger\/([\d.]+)/], ["qq", /\bm?qqbrowser\/([0-9.]+)/], ["green", "greenbrowser"], ["tt", /\btencenttraveler ([0-9.]+)/], ["liebao", function (ua) {
        if (ua.indexOf("liebaofast") >= 0) {
            return (/\bliebaofast\/([0-9.]+)/
            );
        }
        if (ua.indexOf("lbbrowser") === -1) {
            return false;
        }
        var version;
        try {
            if (external && external.LiebaoGetVersion) {
                version = external.LiebaoGetVersion();
            }
        } catch (ex) {/* */
        }
        return {
            version: version || NA_VERSION
        };
    }], ["tao", /\btaobrowser\/([0-9.]+)/], ["coolnovo", /\bcoolnovo\/([0-9.]+)/], ["saayaa", "saayaa"],
    // 有基于 Chromniun 的急速模式和基于 IE 的兼容模式。必须在 IE 的规则之前。
    ["baidu", /\b(?:ba?idubrowser|baiduhd)[ \/]([0-9.x]+)/],
    // 后面会做修复版本号，这里只要能识别是 IE 即可。
    ["ie", re_msie], ["mi", /\bmiuibrowser\/([0-9.]+)/],
    // Opera 15 之后开始使用 Chromniun 内核，需要放在 Chrome 的规则之前。
    ["opera", function (ua) {
        var re_opera_old = /\bopera.+version\/([0-9.ab]+)/;
        var re_opera_new = /\bopr\/([0-9.]+)/;
        return re_opera_old.test(ua) ? re_opera_old : re_opera_new;
    }], ["oupeng", /\boupeng\/([0-9.]+)/], ["yandex", /yabrowser\/([0-9.]+)/],
    // 支付宝手机客户端
    ["ali-ap", function (ua) {
        if (ua.indexOf("aliapp") > 0) {
            return (/\baliapp\(ap\/([0-9.]+)\)/
            );
        } else {
            return (/\balipayclient\/([0-9.]+)\b/
            );
        }
    }],
    // 支付宝平板客户端
    ["ali-ap-pd", /\baliapp\(ap-pd\/([0-9.]+)\)/],
    // 支付宝商户客户端
    ["ali-am", /\baliapp\(am\/([0-9.]+)\)/],
    // 淘宝手机客户端
    ["ali-tb", /\baliapp\(tb\/([0-9.]+)\)/],
    // 淘宝平板客户端
    ["ali-tb-pd", /\baliapp\(tb-pd\/([0-9.]+)\)/],
    // 天猫手机客户端
    ["ali-tm", /\baliapp\(tm\/([0-9.]+)\)/],
    // 天猫平板客户端
    ["ali-tm-pd", /\baliapp\(tm-pd\/([0-9.]+)\)/],
    // UC 浏览器，可能会被识别为 Android 浏览器，规则需要前置。
    // UC 桌面版浏览器携带 Chrome 信息，需要放在 Chrome 之前。
    ["uc", function (ua) {
        if (ua.indexOf("ucbrowser/") >= 0) {
            return (/\bucbrowser\/([0-9.]+)/
            );
        } else if (ua.indexOf("ubrowser/") >= 0) {
            return (/\bubrowser\/([0-9.]+)/
            );
        } else if (/\buc\/[0-9]/.test(ua)) {
            return (/\buc\/([0-9.]+)/
            );
        } else if (ua.indexOf("ucweb") >= 0) {
            // `ucweb/2.0` is compony info.
            // `UCWEB8.7.2.214/145/800` is browser info.
            return (/\bucweb([0-9.]+)?/
            );
        } else {
            return (/\b(?:ucbrowser|uc)\b/
            );
        }
    }], ["chrome", / (?:chrome|crios|crmo)\/([0-9.]+)/],
    // Android 默认浏览器。该规则需要在 safari 之前。
    ["android", function (ua) {
        if (ua.indexOf("android") === -1) {
            return;
        }
        return (/\bversion\/([0-9.]+(?: beta)?)/
        );
    }], ["blackberry", function (ua) {
        var m = ua.match(re_blackberry_10) || ua.match(re_blackberry_6_7) || ua.match(re_blackberry_4_5);
        return m ? { version: m[1] } : "blackberry";
    }], ["safari", /\bversion\/([0-9.]+(?: beta)?)(?: mobile(?:\/[a-z0-9]+)?)? safari\//],
    // 如果不能被识别为 Safari，则猜测是 WebView。
    ["webview", /\bcpu(?: iphone)? os (?:[0-9._]+).+\bapplewebkit\b/], ["firefox", /\bfirefox\/([0-9.ab]+)/], ["nokia", /\bnokiabrowser\/([0-9.]+)/]];
    // 针对同源的 TheWorld 和 360 的 external 对象进行检测。
    // @param {String} key, 关键字，用于检测浏览器的安装路径中出现的关键字。
    // @return {Undefined,Boolean,Object} 返回 undefined 或 false 表示检测未命中。
    function checkTW360External(key) {
        if (!external) {
            return;
        } // return undefined.
        try {
            //        360安装路径：
            //        C:%5CPROGRA~1%5C360%5C360se3%5C360SE.exe
            var runpath = external.twGetRunPath.toLowerCase();
            // 360SE 3.x ~ 5.x support.
            // 暴露的 external.twGetVersion 和 external.twGetSecurityID 均为 undefined。
            // 因此只能用 try/catch 而无法使用特性判断。
            var security = external.twGetSecurityID(win);
            var version = external.twGetVersion(security);

            if (runpath && runpath.indexOf(key) === -1) {
                return false;
            }
            if (version) {
                return { version: version };
            }
        } catch (ex) {/* */
        }
    }
    // 解析使用 Trident 内核的浏览器的 `浏览器模式` 和 `文档模式` 信息。
    // @param {String} ua, userAgent string.
    // @return {Object}
    function IEMode(ua) {
        if (!re_msie.test(ua)) {
            return null;
        }

        var m, engineMode, engineVersion, browserMode, browserVersion;

        // IE8 及其以上提供有 Trident 信息，
        // 默认的兼容模式，UA 中 Trident 版本不发生变化。
        if (ua.indexOf("trident/") !== -1) {
            m = /\btrident\/([0-9.]+)/.exec(ua);
            if (m && m.length >= 2) {
                // 真实引擎版本。
                engineVersion = m[1];
                var v_version = m[1].split(".");
                v_version[0] = parseInt(v_version[0], 10) + 4;
                browserVersion = v_version.join(".");
            }
        }

        m = re_msie.exec(ua);
        browserMode = m[1];
        var v_mode = m[1].split(".");
        if (typeof browserVersion === "undefined") {
            browserVersion = browserMode;
        }
        v_mode[0] = parseInt(v_mode[0], 10) - 4;
        engineMode = v_mode.join(".");
        if (typeof engineVersion === "undefined") {
            engineVersion = engineMode;
        }

        return {
            browserVersion: browserVersion,
            browserMode: browserMode,
            engineVersion: engineVersion,
            engineMode: engineMode,
            compatible: engineVersion !== engineMode
        };
    }
    // UserAgent Detector.
    // @param {String} ua, userAgent.
    // @param {Object} expression
    // @return {Object}
    //    返回 null 表示当前表达式未匹配成功。
    function detect(name, expression, ua) {
        var expr = isFunction(expression) ? expression.call(null, ua) : expression;
        if (!expr) {
            return null;
        }
        var info = {
            name: name,
            version: NA_VERSION,
            codename: ""
        };
        var t = toString(expr);
        if (expr === true) {
            return info;
        } else if (t === "[object String]") {
            if (ua.indexOf(expr) !== -1) {
                return info;
            }
        } else if (isObject(expr)) {
            // Object
            if (expr.hasOwnProperty("version")) {
                info.version = expr.version;
            }
            return info;
        } else if (expr.exec) {
            // RegExp
            var m = expr.exec(ua);
            if (m) {
                if (m.length >= 2 && m[1]) {
                    info.version = m[1].replace(/_/g, ".");
                } else {
                    info.version = NA_VERSION;
                }
                return info;
            }
        }
    }

    var na = { name: "", version: "" };
    // 初始化识别。
    function init(ua, patterns, factory, detector) {
        var detected = na;
        each(patterns, function (pattern) {
            var d = detect(pattern[0], pattern[1], ua);
            if (d) {
                detected = d;
                return false;
            }
        });
        factory.call(detector, detected.name, detected.version);
    }
    // 解析 UserAgent 字符串
    // @param {String} ua, userAgent string.
    // @return {Object}
    var parse = function (ua) {
        ua = (ua || "").toLowerCase();
        var d = {};

        init(ua, DEVICES, function (name, version) {
            var v = parseFloat(version);
            d.device = {
                name: name,
                version: v,
                fullVersion: version
            };
            d.device[name] = v;
        }, d);

        init(ua, OS, function (name, version) {
            var v = parseFloat(version);
            d.os = {
                name: name,
                version: v,
                fullVersion: version
            };
            d.os[name] = v;
        }, d);

        var ieCore = IEMode(ua);

        init(ua, ENGINE, function (name, version) {
            var mode = version;
            // IE 内核的浏览器，修复版本号及兼容模式。
            if (ieCore) {
                version = ieCore.engineVersion || ieCore.engineMode;
                mode = ieCore.engineMode;
            }
            var v = parseFloat(version);
            d.engine = {
                name: name,
                version: v,
                fullVersion: version,
                mode: parseFloat(mode),
                fullMode: mode,
                compatible: ieCore ? ieCore.compatible : false
            };
            d.engine[name] = v;
        }, d);

        init(ua, BROWSER, function (name, version) {
            var mode = version;
            // IE 内核的浏览器，修复浏览器版本及兼容模式。
            if (ieCore) {
                // 仅修改 IE 浏览器的版本，其他 IE 内核的版本不修改。
                if (name === "ie") {
                    version = ieCore.browserVersion;
                }
                mode = ieCore.browserMode;
            }
            var v = parseFloat(version);
            d.browser = {
                name: name,
                version: v,
                fullVersion: version,
                mode: parseFloat(mode),
                fullMode: mode,
                compatible: ieCore ? ieCore.compatible : false
            };
            d.browser[name] = v;
        }, d);
        return d;
    };

    detector = parse(userAgent + " " + appVersion + " " + vendor);

    var detector$1 = detector;

    const device = require('current-device').default;

    var sha1 = require('sha1');
    var Base64 = require('js-base64').Base64;

    // 兼容单元测试环境
    let win$1;
    if (typeof window === 'undefined') {
      win$1 = {
        navigator: {
          userAgent: ''
        },
        location: {
          pathname: '',
          href: ''
        },
        document: {},
        screen: {
          width: '',
          height: ''
        }
      };
    } else {
      win$1 = window;
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
        _.each(slice.call(arguments, 1), function (source) {
          for (let prop in source) {
            if (source[prop] !== void 0) {
              obj[prop] = source[prop];
            }
          }
        });
        return obj;
      },
      isObject(obj) {
        return obj === Object(obj) && !_.isArray(obj);
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
        _.each(obj, function (value) {
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
        if (typeof fn === 'function') {
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
        if (typeof obj === 'string') {
          ret = obj.slice(0, length);
        } else if (_.isArray(obj)) {
          ret = [];
          _.each(obj, function (val) {
            ret.push(_.truncate(val, length));
          });
        } else if (_.isObject(obj)) {
          ret = {};
          _.each(obj, function (val, key) {
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
        let use_val,
            use_key,
            tmp_arr = [];

        if (_.isUndefined(arg_separator)) {
          arg_separator = '&';
        }

        _.each(formdata, function (val, key) {
          use_val = encodeURIComponent(val.toString());
          use_key = encodeURIComponent(key);
          tmp_arr[tmp_arr.length] = use_key + '=' + use_val;
        });

        return tmp_arr.join(arg_separator);
      },
      // 删除左右两端的空格
      trim(str) {
        if (!str) return;
        return str.replace(/(^\s*)|(\s*$)/g, "");
      },
      // 验证yyyy-MM-dd日期格式
      checkTime(timeString) {
        const reg = /^(\d{4})-(\d{2})-(\d{2})$/;
        if (timeString) {
          if (!reg.test(timeString)) {
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
          url = win$1.location.href;
        }
        const regex = /.*\:\/\/([^\/]*).*/;
        const match = url.match(regex);
        if (match) {
          host = match[1];
        }
        return host;
      }
    };
    _.isArray = Array.isArray || function (obj) {
      return Object.prototype.toString.apply(obj) === '[object Array]';
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
        if (device.android()) {
          const sss = win$1.navigator.userAgent.split(";");
          const i = sss.indexOf("Build/");
          if (i > -1) {
            deviceModel = sss[i].substring(0, sss[i].indexOf("Build/"));
          }
        } else if (device.ios()) {
          if (device.iphone()) {
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
        let deviceOsVersion = detector$1.os.name + ' ' + detector$1.os.fullVersion;
        if (isWindows) {
          if (windowsOs[detector$1.os.fullVersion]) {
            deviceOsVersion = windowsOs[detector$1.os.fullVersion];
          }
        }
        return {
          // 设备型号
          deviceModel: deviceModel,
          // 操作系统
          deviceOs: detector$1.os.name,
          // 操作系统版本
          deviceOsVersion: deviceOsVersion,
          // 设备平台
          devicePlatform: devicePlatform,
          // 浏览器名称
          browser: detector$1.browser.name,
          // 浏览器版本
          browserVersion: detector$1.browser.fullVersion,
          // 页面标题
          title: win$1.document.title || '',
          // 页面路径
          urlPath: win$1.location.pathname || '',
          // 页面url
          currentUrl: win$1.location.href,
          // 域名
          currentDomain: this.domain(win$1.location.href),
          // referrer 数据来源
          referrer: win$1.document.referrer,
          // referrer 域名
          referringDomain: this.domain(win$1.document.referrer),
          // 本地语言
          language: win$1.navigator.language || '',
          // 客户端分辨率 width
          screenWidth: win$1.screen.width,
          // 客户端分辨率 height
          screenHeight: win$1.screen.height
        };
      }
    };

    // 消息订阅/推送
    _.innerEvent = {
      /**
       * 订阅
       *  */
      on: function (key, fn) {
        if (!this._list) {
          this._list = {};
        }
        if (!this._list[key]) {
          this._list[key] = [];
        }
        this._list[key].push(fn);
      },
      off: function (key) {
        if (!this._list) {
          this._list = {};
        }
        if (!this._list[key]) {
          return;
        } else {
          delete this._list[key];
        }
      },
      /**
       * 推送
       */
      trigger: function () {
        var args = Array.prototype.slice.call(arguments);
        var key = args[0];
        var arrFn = this._list && this._list[key];
        if (!arrFn || arrFn.length === 0) {
          return;
        }
        for (var i = 0; i < arrFn.length; i++) {
          if (typeof arrFn[i] == 'function') {
            arrFn[i].apply(this, args);
          }
        }
      }
    };

    // 发送数据
    _.sendRequest = function (url, type, data, callback) {
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
        img.onload = function () {
          this.onload = null;
        };
        img.onerror = function () {
          this.onerror = null;
        };
        img.onabort = function () {
          this.onabort = null;
        };
      } else if (type === 'get') {
        url += '?' + _.HTTPBuildQuery(data);
        _.ajax.get(url, callback);
      } else if (type === 'post') {
        _.ajax.get(url, data, callback);
      }
    };

    _.ajax = {
      post: function (url, options, callback, timeout) {
        var that = this;
        that.callback = callback || function (params) {};
        try {
          var req = new XMLHttpRequest();
          req.open('POST', url, true);
          req.setRequestHeader("Content-type", "application/json");
          req.withCredentials = true;
          req.ontimeout = function () {
            that.callback({ status: 0, error: true, message: 'request ' + url + ' time out' });
          };
          req.onreadystatechange = function () {
            if (req.readyState === 4) {
              if (req.status === 200) {
                that.callback(_.JSONDecode(req.responseText));
              } else {
                var message = 'Bad HTTP status: ' + req.status + ' ' + req.statusText;
                that.callback({ status: 0, error: true, message: message });
              }
            }
          };
          req.timeout = timeout || 5000;
          req.send(_.JSONEncode(options));
        } catch (e) {}
      },
      get: function (url, callback) {
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
                  callback({ status: 0, error: true, message: message });
                }
              }
            }
          };
          req.send(null);
        } catch (e) {}
      }
    };

    // uuid
    _.UUID = function () {
      var T = function () {
        var d = 1 * new Date(),
            i = 0;
        while (d == 1 * new Date()) {
          i++;
        }
        return d.toString(16) + i.toString(16);
      };
      var R = function () {
        return Math.random().toString(16).replace('.', '');
      };
      var UA = function (n) {
        var ua = navigator.userAgent,
            i,
            ch,
            buffer = [],
            ret = 0;

        function xor(result, byte_array) {
          var j,
              tmp = 0;
          for (j = 0; j < byte_array.length; j++) {
            tmp |= buffer[j] << j * 8;
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

      return function () {
        // 有些浏览器取个屏幕宽度都异常...
        var se = String(screen.height * screen.width);
        if (se && /\d{5,}/.test(se)) {
          se = se.toString(16);
        } else {
          se = String(Math.random() * 31242).replace('.', '').slice(0, 8);
        }
        var val = T() + '-' + R() + '-' + UA() + '-' + se + '-' + T();
        if (val) {
          just_test_distinctid_2 = 1;
          return val;
        } else {
          just_test_distinctid_2 = 2;
          return (String(Math.random()) + String(Math.random()) + String(Math.random())).slice(2, 15);
        }
      };
    }();

    // 存储方法封装 localStorage  cookie
    _.localStorage = {
      error: function (msg) {
        console.error('localStorage error: ' + msg);
      },

      get: function (name) {
        try {
          return window.localStorage.getItem(name);
        } catch (err) {
          _.localStorage.error(err);
        }
        return null;
      },

      parse: function (name) {
        try {
          return _.JSONDecode(_.localStorage.get(name)) || {};
        } catch (err) {
          // noop
        }
        return null;
      },

      set: function (name, value) {
        try {
          window.localStorage.setItem(name, value);
        } catch (err) {
          _.localStorage.error(err);
        }
      },

      remove: function (name) {
        try {
          window.localStorage.removeItem(name);
        } catch (err) {
          _.localStorage.error(err);
        }
      }
    };
    _.cookie = {
      get: function (name) {
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

      parse: function (name) {
        var cookie;
        try {
          cookie = _.JSONDecode(_.cookie.get(name)) || {};
        } catch (err) {
          // noop
        }
        return cookie;
      },

      set_seconds: function (name, value, seconds, cross_subdomain, is_secure) {
        var cdomain = '',
            expires = '',
            secure = '';

        if (cross_subdomain) {
          var matches = document.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
              domain = matches ? matches[0] : '';

          cdomain = domain ? '; domain=.' + domain : '';
        }

        if (seconds) {
          var date = new Date();
          date.setTime(date.getTime() + seconds * 1000);
          expires = '; expires=' + date.toGMTString();
        }

        if (is_secure) {
          secure = '; secure';
        }

        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
      },

      set: function (name, value, days, cross_subdomain, is_secure) {
        var cdomain = '',
            expires = '',
            secure = '';

        if (cross_subdomain) {
          var matches = document.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
              domain = matches ? matches[0] : '';

          cdomain = domain ? '; domain=.' + domain : '';
        }

        if (days) {
          var date = new Date();
          date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
          expires = '; expires=' + date.toGMTString();
        }

        if (is_secure) {
          secure = '; secure';
        }

        var new_cookie_val = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
        document.cookie = new_cookie_val;
        return new_cookie_val;
      },

      remove: function (name, cross_subdomain) {
        _.cookie.set(name, '', -1, cross_subdomain);
      }
    };

    const windowConsole = win$1.console;
    const console = {
      /** @type {function(...[*])} */
      log: function () {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
          try {
            windowConsole.log.apply(windowConsole, arguments);
          } catch (err) {
            _.each(arguments, function (arg) {
              windowConsole.log(arg);
            });
          }
        }
      },
      /** @type {function(...[*])} */
      error: function () {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
          var args = ['DATracker error:'].concat(_.toArray(arguments));
          try {
            windowConsole.error.apply(windowConsole, args);
          } catch (err) {
            _.each(args, function (arg) {
              windowConsole.error(arg);
            });
          }
        }
      }
    };

    class USER_TRACK {
      constructor(instance) {
        this.instance = instance;
        this['local_storage'] = this.instance['local_storage'];
        this['get_property'] = this.instance['get_property'];
        this['get_device_id'] = this.instance['get_device_id'];
        this['_get_config'] = this.instance['_get_config'];
        this['_set_config'] = this.instance['_set_config'];
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
        let data = {
          dataType: SYSTEM_EVENT_TYPE,
          // 客户端唯一凭证(设备凭证)
          deviceId: this.get_device_id(),
          userId: this.get_property('user_id'),
          // 上报时间
          time: new Date().getTime(),
          // sdk类型 （js，小程序、安卓、IOS、server、pc）
          sdkType: 'js',
          // 属性事件id
          eventId: PEOPLE_PROPERTY_ID,
          // 用户首次访问时间
          persistedTime: this.get_property('persistedTime'),
          // 页面打开场景, 默认 Browser
          pageOpenScene: 'Browser',
          // 自定义用户属性
          attributes: properties || {}
        };

        // 上报数据对象字段截取
        const truncateLength = this._get_config('truncateLength');
        if (_.isNumber(truncateLength) && truncateLength > 0) {
          data = _.truncate(data, truncateLength);
        }
        const callback_fn = response => {
          callback(response, data);
        };
        const url = this._get_config('api_host') + '/track/';
        // 数据上报方式
        const track_type = this._get_config('track_type');
        if (track_type === 'img') {
          url += 'track.gif';
        }
        _.sendRequest(url, track_type, { data: _.base64Encode(_.JSONEncode(truncated_data)), token: this._get_config('token') }, callback_fn);
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
          _.each(prop, (v, k) => {
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
        // 将当前的referrer保存到本地缓存
        this['local_storage'].register({
          sessionReferrer: window.document.referrer
        });
      }
      /**
       *
       * 判断是否为其它渠道
       */
      _check_channel() {
        const referrer = this.get_property('sessionReferrer');
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
        /*
         为了便于绘制用户事件发生轨迹图，区分会话close和最后一次事件触发时间的顺序，会话关闭时间需要做些微调
         1. 如果本地拿到了上次（非会话事件）事件的触发时间，time = this.get_property('LASTEVENT').time + 1;
         2. 如果未拿到，time = new Date().getTime() - 1;
        */
        let time = new Date().getTime() - 1;
        const sessionStartTime = this.get_property('sessionStartTime');
        const LASTEVENT = this.get_property('LASTEVENT');
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
        const session_start_time = 1 * this.get_property('sessionStartTime') / 1000;
        const updated_time = 1 * this.get_property('updatedTime') / 1000;
        const now_date_time_ms = new Date().getTime();
        const now_date_time_se = 1 * now_date_time_ms / 1000;
        // 其它渠道判断
        const other_channel_Bool = this._check_channel();
        //会话结束判断
        if (session_start_time === 0 || now_date_time_se > updated_time + 60 * this._get_config('session_interval_mins') || other_channel_Bool) {
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
          callback = function () {};
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
        user_set_properties = _.extend({}, this.get_property('superProperties'), user_set_properties);

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
          // 页面打开场景, 默认 Browser
          pageOpenScene: 'Browser',
          // 应用凭证
          token: this._get_config('token'),
          costTime: costTime,
          // 当前关闭的会话时长
          sessionTotalLength: properties.sessionTotalLength,
          // 事件自定义属性
          attributes: user_set_properties
        };
        // 合并客户端信息
        data = Object.assign({}, data, _.info.properties());

        //只有已访问页面后，sessionReferrer 重置
        //如果不是内置事件，那么 sessionReferrer 重置
        //如果是'da_activate'，那么 sessionReferrer 重置
        //解决referrer 当是外链时，此时触发自定义事件，引起重启一个session问题。
        if (data_type === BUSSINESS_EVENT_TYPE) {
          // 其它渠道
          if (this._check_channel()) {
            this['local_storage'].register({
              sessionReferrer: document.location.href
            });
          }
        }
        if (!this._get_config('SPA').is) {
          if (['smart_activate', 'smart_session_close'].indexOf(event_name) > 0) {
            this['local_storage'].register({
              sessionReferrer: document.location.href
            });
          }
        }

        // 当启动单页面后，切换页面，refer为空，此时做处理
        if (this._get_config('SPA').is) {
          const sessionReferrer = this.get_property('sessionReferrer');
          if (sessionReferrer !== data['referrer']) {
            data['referrer'] = sessionReferrer;
            data['referringDomain'] = _.info.domain(sessionReferrer);
          }
        }

        // 上报数据对象字段截取
        const truncateLength = this._get_config('truncateLength');
        if (_.isNumber(truncateLength) && truncateLength > 0) {
          data = _.truncate(data, truncateLength);
        }
        const callback_fn = response => {
          callback(response, data);
        };
        const url = this._get_config('api_host') + '/track/';
        const track_type = this._get_config('track_type');
        if (track_type === 'img') {
          url += 'track.gif';
        }
        _.sendRequest(url, track_type, { data: _.base64Encode(_.JSONEncode(truncated_data)), token: this._get_config('token') }, callback_fn);

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
    }

    class LOCAL_STORAGE {
      /**
       * 
       * @param {Object} config
       */
      constructor(config) {
        const local_storage = config['local_storage'];
        if (_.isObject(local_storage)) {
          this['name'] = local_storage['name'] || 'smart_' + config['token'] + '_sdk';
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
        this.set_secure(localStorageConfig('secure_cookie'));
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
      upgrade(config) {}
      // 数据保存到本地
      save() {
        // disabled配置为true, 数据不保存到本地
        if (this.disabled) {
          return;
        }
        this.storage.set(this['name'], _.JSONEncode(this['props']), this.expire_days, this.cross_subdomain, this.secure);
      }
      /**
       * 缓存指定的数据，同时将该数据保存到本地
       * @param {Object} props 
       * @param {Number} days
       * @returns {Boolean} 返回true表示成功
       */
      register(props, days) {
        if (_.isObject(props)) {
          this.expire_days = typeof days === 'undefined' ? this.default_expiry : day;
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
          this.expire_days = typeof days === 'undefined' ? this.default_expiry : day;

          _.each(props, function (val, prop) {
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
       * @param {*} prp
       */
      unregister(prp) {
        if (prp in this['prop']) {
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

    function on(obj, event, callFn) {
      if (obj[event]) {
        const fn = obj[event];
        obj[event] = function () {
          const args = Array.prototype.slice.call(arguments);
          callFn.apply(this, args);
          fn.apply(this, args);
        };
      } else {
        obj[event] = function () {
          const args = Array.prototype.slice.call(arguments);
          callFn.apply(this, args);
        };
      }
    }

    function getPath() {
      return location.pathname + location.search;
    }

    const SPA = {
      config: {
        mode: 'hash',
        track_replace_state: false,
        callback_fn: () => {}
      },
      init(config) {
        this.config = _.extend(this.config, config || {});
        this.path = getPath();
        this.event();
      },
      event() {
        if (this.config.mode === 'history') {
          if (!history.pushState || !window.addEventListener) return;
          on(history, 'pushState', this.pushStateOverride.bind(this));
          on(history, 'replaceState', this.replaceStateOverride.bind(this));
          window.addEventListener('popstate', this.handlePopState.bind(this));
        } else if (this.config.mode === 'hash') {
          _.register_hash_event(this.handleHashState.bind(this));
        }
      },
      pushStateOverride() {
        this.handleUrlChange(true);
      },
      replaceStateOverride() {
        this.handleUrlChange(false);
      },
      handlePopState() {
        this.handleUrlChange(true);
      },
      handleHashState() {
        this.handleUrlChange(true);
      },
      handleUrlChange(historyDidUpdate) {
        setTimeout(() => {
          if (this.config.mode === 'hash') {
            if (_.isFunction(this.config.callback_fn)) {
              this.config.callback_fn.call();
              _.innerEvent.trigger('singlePage:change');
            }
          } else if (this.config.mode === 'history') {
            const oldPath = this.path;
            const newPath = getPath();
            if (oldPath != newPath && this.shouldTrackUrlChange(newPath, oldPath)) {
              this.path = newPath;
              if (historyDidUpdate || this.config.track_replace_state) {
                if (typeof this.config.callback_fn === 'function') {
                  this.config.callback_fn.call();
                  _.innerEvent.trigger('singlePage:change');
                }
              }
            }
          }
        }, 0);
      },
      shouldTrackUrlChange(newPath, oldPath) {
        return !!(newPath && oldPath);
      }
    };

    class SMARTLib {
      /**
       * 
       * @param {String} token 上报数据凭证
       * @param {Object} config sdk客户端配置
       */
      constructor(token, config) {
        this['__loaded'] = true;
        this._ = _;
        this['config'] = {};
        this._set_config(_.extend({}, DEFAULT_CONFIG, CONFIG, config, { 'token': token }));
        this['local_storage'] = new LOCAL_STORAGE(this['config']);
        // 运行钩子函数
        this._loaded();
        // 实例化事件对象
        this['event'] = new EVENT_TRACK(this);
        // 实例化用户对象
        this['user'] = new USER_TRACK(this);
        // 设置设备凭证
        this._set_device_id();
        // persistedTime 首次访问应用时间
        this['local_storage'].register_once({ 'persistedTime': new Date().getTime() }, '');
        // 单页面
        if (this._get_config('SPA').is) {
          this._SPA();
        }
      }
      // 单页面应用（影响PV）
      _SPA() {
        SPA.init({
          mode: this._get_config('SPA').mode,
          callback_fn: () => {}
        });
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
      // sdk初始化之前触发的钩子函数，该方法必须在初始化子模块前以及上报数据前使用
      _loaded() {
        try {
          this._get_config('loaded')(this);
        } catch (error) {
          console.error(error);
        }
      }
      /**
       * 设置本地设备凭证
       * 若是首次访问（本地无设备凭证），上报用户首次访问网站事件
       */
      _set_device_id() {
        let track_data = {};
        if (!this.get_device_id()) {
          this['local_storage'].register_once({ 'deviceId': _.UUID() }, '');
          track_data = this.track('smart_activate');
        }
        return track_data;
      }

      // 获取唯一凭证（设备标记）
      get_device_id() {
        return this.get_property('deviceId');
      }
      // 获取指定本地存储属性（缓存和本地）
      get_property(prop_name) {
        return this['local_storage']['props'][prop_name];
      }
      /**
       * 设置一个指定事件的耗时监听器
       * @param {String} event_name
       */
      time_event(event_name) {
        this['event'].time_event(event_name);
      }
      /**
       * 发送PV事件，在此之前检测session
       * @param {Object} properties  pv属性
       * @param {*} callback 
       */
      track_pv(properties, callback) {
        this['event'].track_pv(properties, callback);
      }
      /**
       * 追踪事件（上报用户事件触发数据）
       * @param {String} event_name 事件名称（必须）
       * @param {Object} properties 事件属性
       * @param {Function} callback 上报后的回调方法
       * @param {String} event_type 自定义事件类型
       * @returns {Object} track_data 上报的数据
       */
      track_event(event_name, properties, callback, event_type) {
        this['event'].track(event_name, properties, callback, event_type);
      }
      /**
       * 设置事件自定义通用属性
       * 成功设置事件通用属性后，再通过 track_event: 追踪事件时，事件通用属性会被添加进每个事件中。
       * 重复调用 register_event_super_properties: 会覆盖之前已设置的通用属性。
       */
      register_event_super_properties(prop, to) {
        let set_props = {};
        let super_properties = this.get_property('superProperties');
        if (_.isObject(prop)) {
          _.each(prop, (v, k) => {
            set_props[k] = v;
          });
        } else {
          set_props[prop] = to;
        }
        // 注意合并顺序
        super_properties = _.extend({}, super_properties, set_props);
        this['local_storage'].register({
          superProperties: super_properties
        });
      }
      /**
       * 设置事件自定义通用属性
       * 成功设置事件通用属性后，再通过 track_event: 追踪事件时，事件通用属性会被添加进每个事件中。
       * 不覆盖之前已经设定的通用属性。
       */
      register_event_super_properties_once(prop, to) {
        let set_props = {};
        let super_properties = this.get_property('superProperties');
        if (_.isObject(prop)) {
          _.each(prop, (v, k) => {
            set_props[k] = v;
          });
        } else {
          set_props[prop] = to;
        }
        // 注意合并顺序
        super_properties = _.extend({}, set_props, super_properties);
        this['local_storage'].register({
          superProperties: super_properties
        });
      }
      /**
       * 删除指定通用事件属性
       * @param {String} prop_name 
       */
      unregister_event_super_properties(prop_name) {
        if (_.isString(prop_name)) {
          let super_properties = this.get_property('superProperties');
          if (_.isObject(super_properties)) {
            delete super_properties[prop_name];
            this['local_storage'].register({
              superProperties: super_properties
            });
          }
        }
      }
      /**
       * 清除本地已设置的通用事件属性
       */
      clear_event_super_properties() {
        this['local_storage'].register({
          superProperties: {}
        });
      }
      /**
       * 查看当前已设置的通用事件属性
       */
      current_event_super_properties() {
        return this.get_property('superProperties');
      }
    }

    class LoaderSync {
      constructor() {
        window['smart'] = this;
      }
      init(token, config) {
        if (this['__loaded']) {
          return;
        }
        this.instance = new SMARTLib(token, config);
        this.instance.init = this['init'];
        window['smart'] = this.instance;
      }
    }

    new LoaderSync();

}());