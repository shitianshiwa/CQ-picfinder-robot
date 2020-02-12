# CQ-picfinder-robot

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

# 安装模块失败的解决方法
* https://github.com/Tsuk1ko/CQ-picfinder-robot/issues/42#issuecomment-572051285
## 1
* https://npm.taobao.org/
* npm config set registry https://registry.npm.taobao.org
* npm config get registry
## 2
单纯挂的系统代理是没用的，因为命令行并不走系统代理，你需要用 sstap 之类的工具代理，或者尝试按下面的方法为 npm 设置代理
以本地端口为1080的小飞机为例
* npm config set proxy http://127.0.0.1:1080
* npm config set https-proxy http://127.0.0.1:1080
# 如果要取消
* npm config delete proxy
* npm config delete https-proxy