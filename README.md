# CQ-picfinder-robot

# 已经连node-v13.9.0-windows-x64一块打包了

# 如果是使用高版本的nodejs，需要删掉package-lock.json，再自己安装一次 sqlite sqlite3 canvas

npm i sqlite3

https://www.npmjs.com/package/sqlite

https://www.npmjs.com/package/sqlite3

https://www.npmjs.com/package/canvas

当前跟进原作者版本：v2.18.1 （定时回复（reminder.js）和broadcast.js为最新版）
未跟进内容有：
v2.13.2
- 弃用 mysql，仅使用 sqlite，配置项转移
v2.14.2
 自定义每日资料卡点赞名单
- 配置项变更
v2.15.0 
- 配置项变更
  - M `picfinder` -> `bot`，会自动迁移，无需手动更改
v2.15.1
- 为`config.json`增加`$schema`
v2.15.2
- 搜图参数及图库关键字中的`book`修改为`doujin`，但`book`依然可用
v2.16.1
每日任务
debug（调试）模式下长消息截断
v2.17.0
支持[配置热重载](https://github.com/Tsuk1ko/cq-picsearcher-bot/wiki/%E5%A6%82%E4%BD%95%E9%A3%9F%E7%94%A8#%E9%85%8D%E7%BD%AE%E7%83%AD%E9%87%8D%E8%BD%BD)
- 改进定时提醒的逻辑
- 修复机器人手动入群后没有文字反馈的问题
v2.17.0
fix: 发送两次已上线
v2.18.0
增加[语言库](https://github.com/Tsuk1ko/cq-picsearcher-bot/wiki/%E9%99%84%E5%8A%A0%E5%8A%9F%E8%83%BD#%E8%AF%AD%E8%A8%80%E5%BA%93%E8%87%AA%E5%8A%A8%E5%9B%9E%E5%A4%8D)功能（自动回复）
- 配置项变更
  - A `bot.corpus`
v2.18.1
- 修复消息群发失效 ([#101](https://github.com/Tsuk1ko/cq-picsearcher-bot/issues/101))
chore: 改用全局函数



当前改为适配go-cqhttp https://github.com/Mrs4s/go-cqhttp/ 

连接方式改为 HTTP POST多点上报 https://github.com/howmanybots/cqhttp-node-sdk

1、强化了b站视频av/bv号解析功能，改了下解析b站分享小程序判断

2、强化搜图防御（可以让指定群不能搜图，相似度低时，saucenao或WhatAnime均会隐藏简略图（90%以上相似度才不隐藏，r18结果大概也都会隐藏（没彻底测试过）），只有指定群和指导好友QQ可以用a2d搜图，因为a2d很难防御）

3、签到改为出图片功能，图片名字要求为纯数字.jpg，例如：0.jpg,1.jpg...

待补充...


这是一个以 Nodejs 编写的酷Q机器人插件，用于搜图、搜番、搜本子，并夹带了许多娱乐向功能（。）

目前支持：

- [saucenao](https://saucenao.com)
- [WhatAnime](https://trace.moe)
- [ascii2d](https://ascii2d.net)

附加功能：

- 复读
- setu
- OCR
- 明日方舟公开招募计算
- 定时提醒

详细说明请移步 [Wiki](https://github.com/Tsuk1ko/CQ-picfinder-robot/wiki)

## TODO

重构为更加模块化的一个机器人框架，以支持自定义插件

# 其它以CQ-picfinder-robot为基础的魔改版
- https://github.com/Ninzore/Wecab

# 安装模块失败的解决方法
* https://github.com/Tsuk1ko/CQ-picfinder-robot/issues/42#issuecomment-572051285
## 1
* https://npm.taobao.org/
* npm config set registry https://registry.npm.taobao.org
* npm config get registry
## 2
单纯挂的系统代理是没用的，因为命令行并不走系统代理，你需要用 [sstap](https://github.com/FQrabbit/SSTap-Rule) 之类的工具代理，或者尝试按下面的方法为 npm 设置代理
以本地端口为1080的小飞机为例
* npm config set proxy http://127.0.0.1:1080
* npm config set https-proxy http://127.0.0.1:1080
# 如果要取消
* npm config delete proxy
* npm config delete https-proxy
