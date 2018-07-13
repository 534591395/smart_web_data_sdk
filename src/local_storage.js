import {_, console} from './utils';


class LOCAL_STORAGE {
  /**
   * 
   * @param {Object} config
   */
  constructor(config) {
    this['name'] = 'smart_' + config['token'] + '_sdk';
    let storage_type = 'cookie';
    if (_.isObject(config['local_storage'])) {
      this['name'] = config['local_storage']['name'] || this['name'];
      storage_type = config['local_storage']['type'] || storage_type;
    }
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
  }
  // 加载本地存储信息
  load() {
    const localData = this['storage'].parse(this['name']);
    if (localData) {
      this['props'] = _.extend({}, localData);
    }
  }
  // 更新配置信息
  update_config(config) {

  }
};

export default LOCAL_STORAGE;