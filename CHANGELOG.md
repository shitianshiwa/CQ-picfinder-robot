# 更新日志

## 2020

### 3-14 v2.11.9

- 更换 akhr 数据地址 ([#49](../../issues/49))
- 增加 whatanime 的 token 设置
- 配置项变更
  - A `whatanimeToken`

### 3-9 v2.11.8

- 增加 setu 的 apikey 设置
- 配置项变更
  - A `picfinder.setu.apikey`

### 2-21 v2.11.7

- 修复通用处理完成后未停止事件传播的问题 ([#36](../../issues/36))

### 2-18 v2.11.6

- WhatAnime 使用官方提供的 API

### 2-03 v2.11.5

- 增加 SauceNao 低相似度值自定义配置
- 增加“SauceNao 结果相似度过低时结果缩略图的替代文字”的配置
- 配置项变更
  - A `picfinder.saucenaoLowAcc`
  - A `picfinder.replys.lowAccImgPlaceholder`

### 2-01 v2.11.4

- 增加“SauceNao 结果相似度过低时隐藏结果缩略图”的配置
- 配置项变更
  - A `picfinder.saucenaoHideImgWhenLowAcc`

### 1-29 v2.11.3

- 增加对`http://www.pixiv.net/(artworks|users)/[0-9]+`链接的短缩

### 1-21 v2.11.2

- 增加配置项用于控制是否在 saucenao 结果低相似度或配额耗尽时使用 ascii2d
- 配置项变更
  - A `picfinder.useAscii2dWhenQuotaExcess`
  - A `picfinder.useAscii2dWhenLowAcc`

### 1-15 v2.11.1

- 因酷Q不支持本地发送大于 4M 的图片，因此开启反和谐后如果没有开启 size1200 并且原图大小超过 3M，将会自动使用 size1200 ([#40](../../issues/40))

## 2019

### 12-18 v2.11.0

- 当 ascii2d 失败时返回错误信息
- 支持自定义 ascii2d 的域名
- saucenao, whatanime, ascii2d 的自定义域名支持带上协议，即支持以下写法
  - `example.com`：将会使用`http://example.com`；特殊地，上面三者的官方域名将会使用 https
  - `http://example.com`或`https://example.com`
- 支持[群发消息](../../wiki/%E5%A6%82%E4%BD%95%E9%A3%9F%E7%94%A8#%E7%BE%A4%E5%8F%91%E6%B6%88%E6%81%AF)
- 配置项变更
  - A `ascii2dHost`

### 12-09 v2.10.1

- 增大 setu 反和谐力度
- 支持获取 yande.re 结果的原出处
- 增加`--help`,`--about`,`--version`命令

### 12-02 v2.10.0

- setu 反和谐
- 配置项变更
  - A `picfinder.setu.antiShielding`

### 11-05 v2.9.5

- 在 ascii2d 搜索失败时返回失败提示语 #31

### 10-29 v2.9.4

- 使用 named-regexp-groups 模块以解决某些 node 版本莫名其妙无法使用命名正则表达式捕获组的问题
- 搜图错误时的回复增加了 saucenao host index

### 10-25 v2.9.3

- 支持发送 master1200 大小的 setu 以改善小水管或国内机器发图速度
- 配置项变更
  - A `picfinder.setu.size1200`

### 10-22 v2.9.2

- 修复 admin 搜图时的记录问题
- 修复 npm 脚本错误
- 改善 setu 正则表达式

### 10-15 v2.9.1

- 增加 pm2 配置文件，目前可直接使用`pm2 start|stop|restart|logs`等命令控制
- 增加按关键词发 setu 以及 r18 setu 功能，若从旧版本升级，请参考 Wiki 中 setu 功能说明进行设置
- 配置项变更（重要）
  - A `picfinder.setu.r18OnlyInWhite`
  - M `picfinder.regs.setu`

### 08-21 v2.8.0

- 增加对提醒功能最小提醒间隔的限制，新增配置项支持限制使用场景
- 提醒功能的 cron 表达式变更为使用分号分隔
- 增加设置项`picfinder.proxy`，支持使用 http 或 socks 代理

### 08-21 v2.7.2

- 增加连接错误的输出
- 对红名链接做 is.gd 短链接处理并使用防红名跳转

### 08-16 v2.7.1

- 对红名链接做 t.cn 短链接处理（在国外服务器上访问 API 有可能会有连接重置问题，已弃用）

### 08-16 v2.7.0

- 增加配置项`picfinder.saucenaoDefaultDB`，用于设置默认 saucenao DB
- 增加定时提醒功能，详见 README

### 08-01 v2.6.0

- 增加 SQLite 支持，增加设置项`mysql.sqlite`
- saucenao 配额耗尽后自动使用 ascii2d

### 07-07 v2.5.4

- 【腾讯OCR】支持轮换 API 使用以变相提升免费额度
- 对【明日方舟公开招募计算器】的 OCR 增加了纠错
- 增加配置项
  - `picfinder.searchModeTimeout`
  - `picfinder.ocr.tencent.useApi`

### 07-02 v2.5.3

- 增加了【腾讯OCR】的支持
- 增加了`picfinder.setu.pximgServerPort`和`picfinder.setu.usePximgAddr`设置项，以方便使用 Docker 版酷Q的用户

### 05-25 v2.5.2

- 增加了【百度OCR】的支持，以提升对明日方舟公开招募词条的识别率和准确率
- **`ocr`部分的配置格式有改动，请参照新的`config.default.json`进行修改**
- 对【明日方舟公开招募计算器】进行了许多改进

### 05-24 v2.5.1

- `--add-group=`加群指令现在可以直接同意发送指令之前接收到的入群邀请了
- 对【明日方舟公开招募计算器】进行了许多改进

### 05-21 v2.5.0

- 加入【明日方舟公开招募计算器】功能，测试中

### 04-26 v2.4.0

- 增加对 ascii2d 的支持
- pixiv 结果会同时输出画师主页
- 对 danbooru 等标有原始来源的站点会自动获取原始链接
- 增加 OCR 功能
- 移除“文字模式”`textMode`设定，废弃使用分享形式发送结果的方式
- 对 WhatAnime 相关配置进行了调整，可参考新的`config.default.json`，但仍然兼容以前的配置方式

### 01-04 v2.3.2

- 增加检测问题回答加好友的机制

## 2018

### 12-05 v2.3.0

- 未在`config.json`中指定的配置将会使用`config.default.json`中的默认值
- 对 setu 功能进行了机制完善
- 稳定性提升

### 11-27 v2.2.1

一大堆改动，忘了写懒得补了 \_(:3」∠)\_

### 08-16 v2.1.0

- （暴力地）修复了当图片标题含有 emoji 时分享不正常的 bug
- 根据 @fuochai 的建议，将p站链接替换成短链接

### 07-16 v2.0.1

- 增加搜图模式下的搜图范围指定功能

### 06-06

- 修复了某些本子因含有特定符号而无法在nhentai搜索到（实际上nhentai有这本子

### 06-05

- 为了减少API的使用次数以及加快搜图速度，增加搜图缓存功能，某张图片（MD5作为凭证）的搜索结果会被缓存指定时间，但可以用`--purge`参数无视缓存强制更新搜图结果
- 增加搜图次数限制功能

### 05-30

- 增加`--book`参数，用于指定搜索本子

### 05-19

- 增加`--danbooru`参数，用于指定搜索图库

### 03-22

- 改进了搜索结果表示
- 弃用`-s`和`-c`参数，使搜图监听模式的触发更人性化
- 使用`--anime`参数可以利用 whatanime 搜番（测试中，尚未作为正式功能，还有很大改进余地）

### 02-24

- 改进`-s`搜图的逻辑，现在可以进入搜图模式之后一直发图片进行查询，直到用`-c`参数退出

### 02-16

- 增加`-s`参数搜图模式，以应对类似“因转发图片至群里而无法@机器人”导致搜图过程复杂的问题

### 02-12

- 支持识别本子的搜索结果

### 01-23

- 搜图支持批量了

### 01-22

- 重写搜图结果识别方法与逻辑
- 修复了当图片不为消息最后一个内容时会导致无法搜图的BUG

### 01-21

初 版
