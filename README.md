## 介绍
`smart_web_data_sdk` 是一个智能的web端大数据库，集成了数据采集、A/B 测试、机器学习。      

**数据采集**    
提供了大数据web端的数据采集功能，采集数据方式提供了代码埋点、可视化埋点、热力图，采集的数据类型多量化。    

**A/B测试**    
web端的A/B测试有三种实验类型：编程实验、多链接实验、可视化实验。本库分别提供了这三种实验类型的拉取配置后的解决方案，同时也提供了可视化实验的可视化配置实现插件。    

**机器学习**    
采集到数据后，机器学习训练好的模型用在web端，sdk提供了解决方案，探索前端的智能化。

## 运行

1. 首先 `npm install` 或 `cnpm install` ，拉取必须包。
2. utils.js 中所需的 `current-device` 依赖包下载完毕后，记得把它的 json 中  "main" 值指向 es6版本  "es/index.js"，否则打包将失败。
3. sdk打包命名：`npm run build`，运行后将在build文件夹下生成执行文件包。
4. 运行示例：运行命令 `npm run server`，后，首次访问 `http://localhost:3300/example/index.html`，浏览器调试下可查看到依次触发了用户首次访问网站事件（smart_activate）、会话开始事件（smart_session_start）、PV事件（smart_pv）。

## 采集库部分文档

#### 初始化

首先页面header头部引入sdk代码，参考示例，然后初始化sdk，并传入token以及设置配置。

默认：
```js
smart.init('token-xxx');
```
设置配置
```js
smart.init('token-xxx',{
  local_storage: {
    type: 'localStorage'
});
```
注意：配置项说明暂请查看 `src/config.js`文件中的 `DEFAULT_CONFIG` 类，里面有详细注解说明。

#### 代码埋点

1. smart.smart_pv()

默认情况下，sdk内部是自动触发PV事件的，若想手动触发，请调用该方法（注意先配置停止自动触发PV事件）。

2. smart.track_event()

需要上报自定义事件，请调用该方法。参数详细说明请查看 `src/main.js` 文件中的 `track_event` 方法注解。

示例：

```js
smart.track_event("buy",{"price":"￥123", "id": 'xxxx-xxxx-xxxx'});
```

3. smart.user.set()

需要自定义用户属性，请调用该方法。参数详细说明请查看 `src/user_track.js` 文件中的 `set` 方法注解。

示例：

```js
smart.user.set({ "name": "白云飘飘","country":"中国","province":"浙江省","city":"杭州市","age":"100","gender":"男", "niu":"自定义用户属性" });
```

#### 进度说明

当前采集库支持到最基本的代码埋点，更多功能作者正在努力开发中。