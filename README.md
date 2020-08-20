# CQ-picfinder-robot

当前跟进原作者版本：v2.14.2 （定时回复（reminder.js）和broadcast.js为最新版）

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
