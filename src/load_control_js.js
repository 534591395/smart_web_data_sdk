/**
 * 远程拉取js插件，包含：可视化埋点（圈选）元素、热力图展示、可视化实验（样式配置）、debug展示
 * 
 * 按需拉取插件规则（根据当前页的url上参数确定拉取）：
 * 
 * 1.可视化埋点圈选元素：当前页url 上含有 'smart_auto_visualization_token' 字段且值存在（该token是保存信息的凭证）
 * 2. 其它待定
 */

import {_, console} from './utils'

 class LOAD_CONTROL_JS {
    constructor(instance) {
      this.instance = instance;
      this._load_js();
    }
    _load_js() {

    }
    // 拉取可视化埋点（圈选）插件
    _load_visualization() {

    }
    is_visualization() {
      
    }
 }

 export default LOAD_CONTROL_JS;
