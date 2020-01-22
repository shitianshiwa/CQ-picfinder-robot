import { version } from './package.json';
import CQWebsocket from 'cq-websocket';
import config from './modules/config';
import saucenao from './modules/saucenao';
import { snDB } from './modules/saucenao';
import whatanime from './modules/whatanime';
import ascii2d from './modules/ascii2d';
import CQ from './modules/CQcode';
import PFSql from './modules/sql/index';
import Logger from './modules/Logger';
import RandomSeed from 'random-seed';
import sendSetu from './modules/plugin/setu';
import ocr from './modules/plugin/ocr';
import Akhr from './modules/plugin/akhr';
import _ from 'lodash';
import minimist from 'minimist';
import { rmdInit, rmdHandler } from './modules/plugin/reminder';
import logger2 from './modules/logger2';
import schedule from 'node-schedule';
import node_localStorage2 from 'node-localstorage';
import dayjs from 'dayjs';
import broadcast from './modules/broadcast';


//常量
const node_localStorage = node_localStorage2.LocalStorage;
const ocrspace = new node_localStorage('./ocrspace');
const ascii2dday = new node_localStorage('./ascii2dday');
const setting = config.picfinder;
const rand = RandomSeed.create();
const searchModeOnReg = new RegExp(setting.regs.searchModeOn);
const searchModeOffReg = new RegExp(setting.regs.searchModeOff);
const signReg = new RegExp(setting.regs.sign);

//初始化
let sqlEnable = false;
if (config.mysql.enable)
    PFSql.sqlInitialize()
    .then(() => (sqlEnable = true))
    .catch(e => {
        console.error(`${getTime()} [error] SQL`);
        console.error(e);
    });
if (setting.akhr.enable) Akhr.init();
if (setting.reminder.enable) rmdInit(replyMsg);

const bot = new CQWebsocket(config); //直接传配置文件进去
const logger = new Logger();

//好友请求
bot.on('request.friend', context => {
    let approve = setting.autoAddFriend;
    const answers = setting.addFriendAnswers;
    if (approve && answers.length > 0) {
        const comments = context.comment.split('\n');
        try {
            answers.forEach((ans, i) => {
                const a = /(?<=回答:).*/.exec(comments[i * 2 + 1])[0];
                if (ans != a) approve = false;
            });
        } catch (e) {
            console.error(e);
            approve = false;
        }
    }
    if (approve)
        bot('set_friend_add_request', {
            flag: context.flag,
            sub_type: 'invite',
            approve: true,
        });
});

//加群请求
const groupAddRequests = {};
bot.on('request.group.invite', context => {
    if (setting.autoAddGroup)
        bot('set_group_add_request', {
            flag: context.flag,
            approve: true,
        });
    else groupAddRequests[context.group_id] = context.flag;
});

//管理员指令
bot.on('message.private', (e, context) => {
    if (context.user_id != setting.admin) return;
    const args = parseArgs(context.message);

    //允许加群
    const group = args['add-group'];
    if (group && typeof group == 'number') {
        if (typeof groupAddRequests[context.group_id] == 'undefined') {
            replyMsg(context, `将会同意进入群${group}的群邀请`);
            //注册一次性监听器
            bot.once('request.group.invite', context2 => {
                if (context2.group_id == group) {
                    bot('set_group_add_request', {
                        flag: context2.flag,
                        type: 'invite',
                        approve: true,
                    });
                    replyMsg(context, `已进入群${context2.group_id}`);
                    return true;
                }
                return false;
            });
        } else {
            bot('set_group_add_request', {
                flag: groupAddRequests[context.group_id],
                type: 'invite',
                approve: true,
            });
            replyMsg(context, `已进入群${context2.group_id}`);
            delete groupAddRequests[context.group_id];
        }
    }

    if (args.broadcast) broadcast(bot, parseArgs(context.message, false, 'broadcast')); //群发消息功能？

    //Ban
    const { 'ban-u': bu, 'ban-g': bg } = args;
    if (bu && typeof bu == 'number') {
        Logger.ban('u', bu);
        replyMsg(context, `已封禁用户${bu}`);
    }
    if (bg && typeof bg == 'number') {
        Logger.ban('g', bg);
        replyMsg(context, `已封禁群组${bg}`);
    }

    //明日方舟
    if (args['update-akhr']) Akhr.updateData().then(() => replyMsg(context, '数据已更新'));

    //停止程序（利用pm2重启）
    if (args.shutdown) {
        replyMsg(context, '搜图已关闭！');
        process.exit(); //并没有使用pm2
    }
});

//设置监听器
if (setting.debug) {
    //私聊
    bot.on('message.private', debugRrivateAndAtMsg);
    //讨论组@
    //bot.on('message.discuss.@me', debugRrivateAndAtMsg);
    //群组@
    bot.on('message.group.@me', debugRrivateAndAtMsg);
} else {
    //私聊
    bot.on('message.private', privateAndAtMsg);
    //讨论组@
    //bot.on('message.discuss.@me', privateAndAtMsg);
    //群组@
    bot.on('message.group.@me', privateAndAtMsg);
    //群组
    bot.on('message.group', groupMsg);
}

//连接相关监听
bot.on('socket.connecting', (wsType, attempts) => console.log(`${getTime()} 连接中[${wsType}]#${attempts}`))
    .on('socket.failed', (wsType, attempts) => console.log(`${getTime()} 连接失败[${wsType}]#${attempts}`))
    .on('socket.error', (wsType, err) => {
        console.error(`${getTime()} 连接错误[${wsType}]`);
        console.error(err);
    })
    .on('socket.connect', (wsType, sock, attempts) => {
        console.log(`${getTime()} 连接成功[${wsType}]#${attempts}`);
        if (setting.admin > 0) {
            setTimeout(() => {
                bot('send_private_msg', {
                    user_id: setting.admin,
                    message: `已上线[${wsType}]#${attempts}`,
                });
            }, 5000);
        }
    });

//connect
bot.connect();

//自动帮自己签到（诶嘿
//以及每日需要更新的一些东西
setInterval(() => {
    if (bot.isReady() && logger.canAdminSign()) {
        setTimeout(() => {
            if (setting.admin > 0) {
                bot('send_like', {
                    user_id: setting.admin,
                    times: 10,
                });
            }
            //更新明日方舟干员数据
            if (setting.akhr.enable) Akhr.updateData();
        }, 60 * 1000);
    }
}, 60 * 60 * 1000);

//通用处理
function commonHandle(e, context) {
    //黑名单检测
    if (Logger.checkBan(context.user_id, context.group_id)) return true;

    //兼容其他机器人
    const startChar = context.message.charAt(0);
    if (startChar == '/' || startChar == '<') return true;

    //通用指令
    const args = parseArgs(context.message);
    if (args.help) {
        replyMsg(context, 'https://github.com/Tsuk1ko/CQ-picfinder-robot/wiki/%E5%A6%82%E4%BD%95%E9%A3%9F%E7%94%A8');
        return true;
    }
    if (args.version) {
        replyMsg(context, version);
        return true;
    }
    if (args.about) {
        replyMsg(context, 'https://github.com/Tsuk1ko/CQ-picfinder-robot');
        return true;
    }

    //setu
    if (setting.setu.enable) {
        if (sendSetu(context, replyMsg, logger, bot)) return true;
    }

    //reminder
    if (setting.reminder.enable) {
        if (rmdHandler(context)) return true;
    }

    return false;
}

//私聊以及群组@的处理
function privateAndAtMsg(e, context) {
    if (commonHandle(e, context)) return;
    if (context.message == '。搜图') {
        returnmsg(context, 0);
        return;
    }
    if (context.message == 'ocr' || context.message == 'OCR') {
        returnmsg(context, 1);
        return;
    }
    if (hasImage(context.message)) {
        //搜图
        e.stopPropagation();
        searchImg(context);
    } else if (signReg.exec(context.message)) {
        //签到
        e.stopPropagation();
        if (logger.canSign(context.user_id)) {
            bot('send_like', {
                user_id: context.user_id,
                times: 10,
            });
            return setting.replys.sign;
        } else return setting.replys.signed;
    } else if (context.message.search('--') !== -1) {
        return;
    } else if (!context.group_id && !context.discuss_id) {
        const db = snDB[context.message];
        let s = [''];
        if (db) {
            logger.smSwitch(0, context.user_id, true);
            logger.smSetDB(0, context.user_id, db);
            return `已临时切换至[${context.message}]搜图模式√`;
        } else {
            if (context.message_type == 'private') {
                let ss = context.message;
                let has = false;
                for (let i = 0; i < s.length; i++) {
                    if (ss == s[i]) {
                        has = true;
                        break;
                    }
                }
                if (has == false) {
                    return setting.replys.default;
                }
            }
        }
    } else {
        //其他指令
        if (context.message_type == 'private') {
            let ss = context.message;
            let has = false;
            for (let i = 0; i < s.length; i++) {
                if (ss == s[i]) {
                    has = true;
                    break;
                }
            }
            if (has == false) {
                return setting.replys.default;
            }
        }
    }
}

//调试模式
function debugRrivateAndAtMsg(e, context) {
    if (context.user_id != setting.admin) {
        e.stopPropagation();
        return setting.replys.debug;
    } else {
        privateAndAtMsg(e, context);
    }
}

//群组消息处理
function groupMsg(e, context) {
    if (commonHandle(e, context)) return;
    if (context.message == '。搜图') {
        returnmsg(context, 0);
        return;
    }
    if (context.message == 'ocr' || context.message == 'OCR') {
        returnmsg(context, 1);
        return;
    }
    //进入或退出搜图模式
    const { group_id, user_id } = context;

    if (searchModeOnReg.exec(context.message)) {
        //进入搜图
        e.stopPropagation();
        if (
            logger.smSwitch(group_id, user_id, true, () => {
                replyMsg(context, setting.replys.searchModeTimeout, true);
            })
        )
            replyMsg(context, setting.replys.searchModeOn, true);
        else replyMsg(context, setting.replys.searchModeAlreadyOn, true);
    } else if (searchModeOffReg.exec(context.message)) {
        e.stopPropagation();
        //退出搜图
        if (logger.smSwitch(group_id, user_id, false)) replyMsg(context, setting.replys.searchModeOff, true);
        else replyMsg(context, setting.replys.searchModeAlreadyOff, true);
    }

    //搜图模式检测
    let smStatus = logger.smStatus(group_id, user_id);
    if (smStatus) {
        //获取搜图模式下的搜图参数
        const getDB = () => {
            let cmd = /^(all|pixiv|danbooru|book|anime)$/.exec(context.message);
            if (cmd) return snDB[cmd[1]] || -1;
            return -1;
        };

        //切换搜图模式
        const cmdDB = getDB();
        if (cmdDB !== -1) {
            logger.smSetDB(group_id, user_id, cmdDB);
            smStatus = cmdDB;
            replyMsg(context, `已切换至[${context.message}]搜图模式√`);
        }

        //有图片则搜图
        if (hasImage(context.message)) {
            //刷新搜图TimeOut
            logger.smSwitch(group_id, user_id, true, () => {
                replyMsg(context, setting.replys.searchModeTimeout, true);
            });
            e.stopPropagation();
            searchImg(context, smStatus);
        }
    } else if (setting.repeat.enable) {
        //复读（
        //随机复读，rptLog得到当前复读次数
        if (logger.rptLog(group_id, user_id, context.message) >= setting.repeat.times && getRand() <= setting.repeat.probability) {
            logger.rptDone(group_id);
            //延迟2s后复读
            setTimeout(() => {
                replyMsg(context, context.message);
            }, 2000);
        } else if (getRand() <= setting.repeat.commonProb) {
            //平时发言下的随机复读
            setTimeout(() => {
                replyMsg(context, context.message);
            }, 2000);
        }
    }
}

//通用信息发送
function returnmsg(context, xuanze) {
    //console.log(context);
    switch (xuanze) {
        case 0:
            let temp = `群聊需@机器人并发图片，而私聊直接发图片即可(需要图片识文功能请输入'ocr'查看说明)(搜图机器人有三个基本命令(QQ群也不用AT)：--help, --about, --version)。搜图次数限制为每日每位用户30次(管理员例外)，一次可以搜多张图片\n---\n在浏览器上运行的调用多引擎进行搜图的脚本 https://github.com/ccloli/Search-By-Image/ （支持浏览器内选图搜索，也支持上传本地图片进行搜索，综合搜图能力比QQ群机器人强一点）。需要浏览器装上脚本管理器扩展(例如tampermonkey等)，浏览器可选谷歌，yandex(手机版也支持扩展)，火狐(手机版也支持扩展)\n参考链接：【教程】还在当求出处的伸手党吗？不如过来学学如何反向搜图（可能少了一些楼层） https://tieba.baidu.com/p/5935336183\nhttps://trace.moe/ 一个查找动画截图的网站\n以下三个都是用来以图搜图的网站。可以搜寻画师或原图等。需要较高的完整度才容易搜得到，一般是用于低分辨率的图找原图或者是找画师id比较有用，对于打码，剪裁过的图比较没辙\nhttps://saucenao.com/ 也可以搜动画截图\nhttps://ascii2d.net/ 二次元画像。这个识图很容易出奇怪的图片(容易见R18)，支持查找推特和pixiv上的图片\nhttps://iqdb.org/ 搜图网站集合网站\nhttps://www.tineye.com/ tineye作为老牌以图搜图的网站，具有极高的精确度，但得到的结果较少，比较适用于寻找更高分辨率图片。可能需要代理才能浏览\n搜索引擎的搜图\n俄罗斯的yandex https://yandex.ru/images/search\n谷歌(要代理) https://www.google.com/imghp\n微软的必应 https://cn.bing.com/visualsearch\n360搜索 https://image.so.com/ 360识图 http://st.so.com/\n百度 http://image.baidu.com/\n搜狗 https://pic.sogou.com/\n[CQ:image,file=xiaoxi/13.jpg]`;
            if (context.message_type == 'group') {
                replyMsg(context, `[CQ:at,qq=${context.user_id}]\n` + temp);
            } else if (context.message_type == 'private') {
                let s = ['--url', '--a2d', '--pixiv', '--danbooru', '--book', '--anime', '--purge', '--help', '--about', '--version'];
                replyMsg(context, temp);
                for (let i = 0; i < s.length; i++) {
                    replyMsg(context, s[i]);
                }
            }
            break;
        case 1:
            let temp2 = `群聊需@机器人发送图片并加上参数才行，私聊仅需加上参数。示例：指定某个语言"图片 --ocr --l=jp" 或者 使用默认语言(日语)"图片 --ocr"\n作者的使用说明：https://github.com/Tsuk1ko/CQ-picfinder-robot/wiki/%E9%99%84%E5%8A%A0%E5%8A%9F%E8%83%BD#ocr-%E6%96%87%E5%AD%97%E8%AF%86%E5%88%AB \n使用的ocr：https://ocr.space/ (国内可能无法访问该服务)[CQ:image,file=xiaoxi/13.jpg]`;
            let s = ['--ocr(默认日语)', '--ocr --l=zh(简体中文)|zht(繁体中文)|jp(日文)|en(英文)|ko(韩语)|fr(法语)|ge(德语)|ru(俄语),需要根据图片内的文字选择一种语言,不选就默认日语'];
            if (context.message_type == 'group') {
                replyMsg(context, `[CQ:at,qq=${context.user_id}]\n` + temp2);
                for (let i = 0; i < s.length; i++) {
                    replyMsg(context, s[i]);
                }
            } else if (context.message_type == 'private') {
                replyMsg(context, temp2);
                for (let i = 0; i < s.length; i++) {
                    replyMsg(context, s[i]);
                }
            }
            break;
    }

}
/*
ch / cn / zh / zhs -> chs （简体中文）
zht -> cht （繁体中文）
en -> eng(英语)
jp -> jpn(日语)
ko -> kor(韩语)
fr -> fre(法语)
ge -> ger(德语)
ru -> rus(俄语)
*/
/**
 * 搜图
 *
 * @param {object} context
 * @param {number} [customDB=-1]
 * @returns
 */
async function searchImg(context, customDB = -1) {
    const args = parseArgs(context.message);

    //OCR
    if (args.ocr) {
        doOCR(context);
        return;
    }

    //明日方舟
    if (args.akhr) {
        doAkhr(context);
        return;
    }

    //决定搜索库
    let db = snDB[setting.saucenaoDefaultDB] || snDB.all;
    if (customDB < 0) {
        if (args.pixiv) db = snDB.pixiv;
        else if (args.danbooru) db = snDB.danbooru;
        else if (args.book) db = snDB.book;
        else if (args.anime) db = snDB.anime;
        else if (args.a2d) db = -10001;
        else if (!context.group_id && !context.discuss_id) {
            //私聊搜图模式
            const sdb = logger.smStatus(0, context.user_id);
            if (sdb) {
                db = sdb;
                logger.smSwitch(0, context.user_id, false);
            }
        }
    } else db = customDB;
    //console.log(context)
    //得到图片链接并搜图
    const msg = context.message;
    const imgs = getImgs(msg);
    var pic_m = false;
    var jishu = 0;
    for (const img of imgs) {
        if (args['url']) replyMsg(context, img.url.replace(/\/[0-9]+\//, '//').replace(/\?.*$/, ''));
        else {
            //获取缓存
            let hasCache = false;
            if (sqlEnable && !args.purge) {
                const sql = new PFSql();
                const cache = await sql.getCache(img.file, db); //仅图片名字判断？
                sql.close();

                //如果有缓存
                if (cache) {
                    hasCache = true;
                    if (context.message_type == 'group') {
                        if (pic_m == false) {
                            replyMsg(context, `[CQ:at,qq=${context.user_id}]\n因为搜任何图片返回的结果都有风险，所以必须转发到私聊`);
                            if (imgs.length > 0) {
                                pic_m = true;
                            }
                        }
                        //replyMsg(context, `因为搜索到的结果有风险，所以自动转发到私聊`);
                    }
                    jishu++;
                    bot('send_private_msg', {
                        user_id: context.user_id,
                        message: jishu.toString(),
                    });
                    for (var cmsg in cache) {
                        bot('send_private_msg', {
                            user_id: context.user_id,
                            message: `&#91;缓存&#93; ${cache[cmsg]}`,
                        });
                    }
                    bot('send_private_msg', {
                        user_id: context.user_id,
                        message: `---`,
                    });
                    //console.log(cmsg);
                    /*if (cmsg == 0) {
                        if (cache[cmsg].indexOf('nhentai.net') !== -1) {
                            if (context.message_type == 'group') {
                                replyMsg(context, `因为搜索到的是本子结果，所以自动转发到私聊`);
                            }
                            //改为私聊
                            bot('send_private_msg', {
                                user_id: context.user_id,
                                message: saRet.msg,
                            });
                        } else {
                            replyMsg(context, `&#91;缓存&#93; ${cache[cmsg]}`);
                            if (cache.length > 1 && context.message_type == 'group') {
                                replyMsg(context, `因为搜索到的结果有风险，所以自动转发到私聊`);
                            }
                        }
                    } else {
                    //改为私聊
                    bot('send_private_msg', {
                        user_id: context.user_id,
                        message: `&#91;缓存&#93; ${cache[cmsg]}`,
                    });
                    }*/
                    //replyMsg(context, `&#91;缓存&#93; ${cmsg}`);
                    /*for (const cmsg of cache) {
                        //console.log(msg);
                        replyMsg(context, `&#91;缓存&#93; ${cmsg}`);
                    }*/
                }
            }

            if (!hasCache) {
                let t = setTimeout(async() => {
                    clearTimeout(t);
                    //检查搜图次数
                    if (context.user_id != setting.admin && !logger.canSearch(context.user_id, setting.searchLimit)) {
                        replyMsg(context, setting.replys.personLimit);
                        return;
                    }

                    const needCacheMsgs = [];
                    let success = true;
                    let useSaucenao = false;
                    let useAscii2d = args.a2d;
                    let useWhatAnime = args.anime;

                    //saucenao
                    if (!useAscii2d) {
                        useSaucenao = true;
                        const saRet = await saucenao(img.url, db, args.debug);
                        if (!saRet.success) success = false;
                        if ((saRet.lowAcc && (db == snDB.all || db == snDB.pixiv)) || saRet.excess) {
                            useAscii2d = true;
                        }
                        if (!saRet.lowAcc && saRet.msg.indexOf('anidb.net') !== -1) { useWhatAnime = true; }
                        if (db == snDB.anime) { useWhatAnime = true; }
                        if (saRet.msg.length > 0) needCacheMsgs.push(saRet.msg);
                        if (context.message_type == 'group') {
                            if (pic_m == false) { //只有在QQ群使用才会发送这条消息
                                replyMsg(context, `[CQ:at,qq=${context.user_id}]\n因为搜任何图片返回的结果都有风险，所以必须转发到私聊`);
                                if (imgs.length > 0) {
                                    pic_m = true;
                                }
                            }
                            //replyMsg(context, `因为搜索到的结果有风险，所以自动转发到私聊`);
                        }
                        //改为私聊
                        jishu++; //发送延迟太大还是导致消息排列错位
                        if (useAscii2d == true || useWhatAnime == true) {
                            bot('send_private_msg', {
                                user_id: context.user_id,
                                message: jishu.toString() + "\n" + saRet.msg + "\n" + saRet.warnMsg,
                            }).catch(err => { logger2.error(new Date().toString() + ",Saucenao," + err) });
                        } else {
                            bot('send_private_msg', {
                                user_id: context.user_id,
                                message: jishu.toString() + "\n" + saRet.msg + "\n" + saRet.warnMsg + "\n---",
                            }).catch(err => { logger2.error(new Date().toString() + ",Saucenao," + err) });
                        }
                        /*if (saRet.msg.indexOf('nhentai.net') !== -1) {
                            if (context.message_type == 'group') {
                                replyMsg(context, `因为搜索到的是本子结果，所以自动转发到私聊`);
                            }
                            //改为私聊
                            bot('send_private_msg', {
                                user_id: context.user_id,
                                message: saRet.msg,
                            });
                        } else {
                            replyMsg(context, saRet.msg);
                            replyMsg(context, saRet.warnMsg);
                        }*/
                        //console.log('1.' + saRet.msg);
                        //console.log('2.' + saRet.warnMsg);
                        //console.log('3.' + saRet.lowAcc);
                    }
                    //ascii2d
                    if (useAscii2d) {
                        if (ascii2dday.getItem('ascii2d') == null) {
                            ascii2dday.setItem('ascii2d', "1");
                        }
                        if (ascii2dday.getItem('ascii2d') <= setting.ascii2dsuotucishu) {
                            const { color, bovw, asErr } = await ascii2d(img.url).catch(asErr => ({
                                asErr,
                            }));
                            let temp = parseInt(ascii2dday.getItem('ascii2d'));
                            temp++;
                            await new Promise(function(resolve, reject) {
                                resolve(ascii2dday.setItem('ascii2d', temp));
                            });
                            if (asErr) {
                                const errMsg = (asErr.response && asErr.response.data.length < 50 && `\n${asErr.response.data}`) || '';
                                bot('send_private_msg', {
                                    user_id: context.user_id,
                                    message: "\n今日使用次数:" + temp + "\n" + `ascii2d 搜索失败${errMsg}`, //ascii2d因未知原因搜索失败
                                });
                                logger2.error(`${getTime()} [error] Ascii2d`);
                                logger2.error(asErr);
                                //console.error(`${getTime()} [error] Ascii2d`);
                                //console.error(asErr);
                            } else {
                                //改为私聊
                                if (useSaucenao == false) {
                                    if (context.message_type == 'group') {
                                        if (pic_m == false) { //只有在QQ群使用才会发送这条消息
                                            replyMsg(context, `[CQ:at,qq=${context.user_id}]\n因为搜任何图片返回的结果都有风险，所以必须转发到私聊`);
                                            if (imgs.length > 0) {
                                                pic_m = true;
                                            }
                                        }
                                        //replyMsg(context, `因为搜索到的结果有风险，所以自动转发到私聊`);
                                    }
                                    jishu++;
                                    bot('send_private_msg', {
                                        user_id: context.user_id,
                                        message: jishu + "\n今日使用次数:" + temp + "\n" + color + "\n" + bovw + `\n---`,
                                    }).catch(err => { logger2.error(new Date().toString() + ",ascii2d," + err) });
                                } else if (useWhatAnime) {
                                    bot('send_private_msg', {
                                        user_id: context.user_id,
                                        message: "今日使用次数:" + temp + "\n" + color + "\n" + bovw,
                                    }).catch(err => { logger2.error(new Date().toString() + ",ascii2d," + err) });
                                } else {
                                    bot('send_private_msg', {
                                        user_id: context.user_id,
                                        message: "今日使用次数:" + temp + "\n" + color + "\n" + bovw + `\n---`,
                                    }).catch(err => { logger2.error(new Date().toString() + ",ascii2d," + err) });
                                }
                                needCacheMsgs.push(color);
                                needCacheMsgs.push(bovw);
                                /*if (context.message_type == 'group') {
                                    replyMsg(context, `因为搜索到的结果有风险，所以自动转发到私聊`);
                                }
                                //改为私聊
                                bot('send_private_msg', {
                                    user_id: context.user_id,
                                    message: color,
                                });
                                bot('send_private_msg', {
                                    user_id: context.user_id,
                                    message: bovw,
                                });
                                //replyMsg(context, color);//什么聊，怎么发
                                //replyMsg(context, bovw);*/
                            }
                        } else {
                            logger2.info("ascii2d:" + ascii2dday.getItem('ascii2d'));
                            bot('send_private_msg', {
                                user_id: context.user_id,
                                message: `ascii2d单日可用次数已耗尽！`,
                            })
                        }
                    }

                    //搜番
                    if (useWhatAnime) {
                        const waRet = await whatanime(img.url, args.debug);
                        if (!waRet.success) success = false; //如果搜番有误也视作不成功
                        //改为私聊
                        if (useSaucenao == false) {
                            jishu++;
                            bot('send_private_msg', {
                                user_id: context.user_id,
                                message: jishu.toString() + "\n" + waRet.msg + "\n" + waRet.msg + "\n---",
                            }).catch(err => { logger2.error(new Date().toString() + ",WhatAnime," + err) });
                        } else {
                            bot('send_private_msg', {
                                user_id: context.user_id,
                                message: waRet.msg + "\n" + waRet.msg + "\n---",
                            }).catch(err => { logger2.error(new Date().toString() + ",WhatAnime," + err) });
                        }
                        //replyMsg(context, waRet.msg);
                        if (waRet.msg.length > 0) needCacheMsgs.push(waRet.msg);
                    }
                    if (success) logger.doneSearch(context.user_id);
                    //将需要缓存的信息写入数据库
                    if (sqlEnable && success) {
                        const sql = new PFSql();
                        await sql.addCache(img.file, db, needCacheMsgs);
                        sql.close();
                    }
                }, 1000);
            }
        }
    }
}

/*
每分钟的第30秒触发： '30 * * * * *'
每小时的1分30秒触发 ：'30 1 * * * *'
每天的凌晨1点1分30秒触发 ：'30 1 1 * * *'
每月的1日1点1分30秒触发 ：'30 1 1 1 * *'
2016年的1月1日1点1分30秒触发 ：'30 1 1 1 2016 *'
每周1的1点1分30秒触发 ：'30 1 1 * * 1'
https://www.jianshu.com/p/8d303ff8fdeb
'0 0 0 * * *'
'0 0 0 1 * *'
console.log(new Date().getFullYear());
console.log(new Date().getMonth());
*/
var j1 = schedule.scheduleJob('0 0 0 * * *', function() { //每天0时0分0秒清0
    ocrspace.setItem('day', "0");
    let t = new Date();
    ascii2dday.setItem('ascii2d', "0");
    logger2.info('每日累计次数清0' + t.toString() + dayjs(t.toString()).format(' A 星期d'));
});
//j1.cancel();
function doOCR(context) {
    const msg = context.message;
    const imgs = getImgs(msg);
    let lang = null;
    const langSearch = /(?<=--l=)[a-zA-Z]{2,3}/.exec(msg);
    //console.log(msg);
    //console.log(langSearch);
    if (langSearch) { lang = langSearch[0]; }
    var ocrjishu = 1;
    const handleOcrResult = (ret) => {
        let t = new Date();
        //console.log(t.toString());
        if (ocrspace.getItem('day') == null) {
            ocrspace.setItem('day', "1");
        } else {
            let temp = parseInt(ocrspace.getItem('day'));
            temp++;
            ocrspace.setItem('day', temp);
        }
        //console.log(t.getMonth());
        let s1 = t.getFullYear() + '-' + (t.getMonth() + 1) + '-mouth';
        //console.log(s1);
        if (ocrspace.getItem(s1) == null) {
            ocrspace.setItem(s1, "1");
        } else {
            let temp = parseInt(ocrspace.getItem(s1));
            temp++;
            ocrspace.setItem(s1, temp);
        }
        let s2 = t.getFullYear() + '-jilu';
        if (ocrspace.getItem(s2) == null) {
            ocrspace.setItem(s2, "1");
        } else {
            let temp = parseInt(ocrspace.getItem(s2));
            temp++;
            ocrspace.setItem(s2, temp);
        }
        //ret.data.ParsedResults[0].ParsedText.replace(/( *)\r\n$/, '').split('\r\n');
        //console.log(JSON.stringify(ret.data));
        if (ret.data.ParsedResults != null) {
            if (ret.data.ParsedResults[0].ParsedText != "") {
                replyMsg(context, ocrjishu.toString() + "、" + ret.data.ParsedResults[0].ParsedText.replace(/( *)\r\n$/, '').split('\r\n').toString() /*必须转成字符串才能发送，否则报错。ret.join('\n')*/ ).catch(e => {
                    replyMsg(context, 'OCR识别发生错误');
                    logger2.error(`${getTime()} [error] OCR`);
                    logger2.error(e);
                });
            } else {
                if (ret.data.ParsedResults[0].ErrorMessage != "") {
                    replyMsg(context, 'OCR识别出现错误:\n' + ret.data.ParsedResults[0].ErrorMessage);
                } else {
                    replyMsg(context, 'OCR识别出现错误:\n' + "没有识别出任何文字。提示：若要识别的图片文字内容为白底黑字，则识别正确率较高");
                }
                logger2.error(`${getTime()} [error] OCR`);
                logger2.error(JSON.stringify(ret.data));
            }
        } else {
            replyMsg(context, 'OCR识别出现严重错误:\n' + JSON.stringify(ret.data.ErrorMessage));
            logger2.error(`${getTime()} [error] OCR`);
            logger2.error(JSON.stringify(ret.data.ErrorMessage));
        }
        ocrjishu++;
        replyMsg(context, '---\n今日累计使用：' + ocrspace.getItem('day') + '|本月累计使用：' + ocrspace.getItem(s1) + '|' + new Date().getUTCFullYear() + '年总累计使用：' + ocrspace.getItem(s2) + '|备注：计数不区分识别成功还是失败');
        //console.log(ret);
    };
    for (const img of imgs) {
        ocr.default(replyMsg, context, img.url, lang).then(handleOcrResult);
    }

}

function doAkhr(context) {
    if (setting.akhr.enable) {
        const msg = context.message;
        const imgs = getImgs(msg);

        const handleWords = words => {
            // fix some ...
            if (setting.akhr.ocr == 'ocr.space') words = _.map(words, w => w.replace(/冫口了/g, '治疗'));
            replyMsg(context, CQ.img64(Akhr.getResultImg(words)));
        };

        const handleError = e => {
            replyMsg(context, '词条识别出现错误：\n' + e);
            console.error(`${getTime()} [error] Akhr`);
            console.error(e);
        };

        for (const img of imgs) {
            ocr[setting.akhr.ocr](img.url, 'chs')
                .then(handleWords)
                .catch(handleError);
        }
    } else {
        replyMsg(context, '该功能未开启');
    }
}

/**
 * 从消息中提取图片
 *
 * @param {string} msg
 * @returns 图片URL数组
 */
function getImgs(msg) {
    const reg = /\[CQ:image,file=([^,]+),url=([^\]]+)\]/g;
    const result = [];
    let search = reg.exec(msg);
    while (search) {
        result.push({
            file: search[1],
            url: search[2],
        });
        search = reg.exec(msg);
    }
    return result;
}

/**
 * 判断消息是否有图片
 *
 * @param {string} msg 消息
 * @returns 有则返回true
 */
function hasImage(msg) {
    return msg.indexOf('[CQ:image') !== -1;
}

/**
 * 回复消息
 *
 * @param {object} context 消息对象
 * @param {string} msg 回复内容
 * @param {boolean} at 是否at发送者
 */
function replyMsg(context, msg, at = false) {
    if (typeof msg != 'string' || msg.length == 0) return;
    if (context.group_id) {
        return bot('send_group_msg', {
            group_id: context.group_id,
            message: at ? CQ.at(context.user_id) + msg : msg,
        });
    } else if (context.discuss_id) {
        return bot('send_discuss_msg', {
            discuss_id: context.discuss_id,
            message: at ? CQ.at(context.user_id) + msg : msg,
        });
    } else if (context.user_id) {
        return bot('send_private_msg', {
            user_id: context.user_id,
            message: msg,
        });
    }
}

/**
 * 生成随机浮点数
 *
 * @returns 0到100之间的随机浮点数
 */
function getRand() {
    return rand.floatBetween(0, 100);
}

function getTime() {
    return new Date().toLocaleString();
}

function parseArgs(str, enableArray = false, _key = null) {
    const m = minimist(
        str
        .replace(/(--\w+)(?:\s*)(\[CQ:)/g, '$1 $2')
        .replace(/(\[CQ:[^\]]+\])(?:\s*)(--\w+)/g, '$1 $2')
        .split(' '), {
            boolean: true,
        }
    );
    if (!enableArray) {
        for (const key in m) {
            if (key == '_') continue;
            if (Array.isArray(m[key])) m[key] = m[key][0];
        }
    }
    if (_key && typeof m[_key] == 'string' && m._.length > 0) { m[_key] += ' ' + m._.join(' '); }
    return m;
}