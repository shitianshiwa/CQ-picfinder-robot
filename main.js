import {
    version
} from './package.json';
import bot from './bot';
import config from './modules/config';
import saucenao from './modules/saucenao';
import {
    snDB
} from './modules/saucenao';
import whatanime from './modules/whatanime';
import ascii2d from './modules/ascii2d';
import CQ from './modules/CQcode';
import Logger from './modules/Logger';
import PFCache from './modules/cache';
import RandomSeed from 'random-seed';
import sendSetu from './modules/plugin/setu';
import ocr from './modules/plugin/ocr';
import Akhr from './modules/plugin/akhr';
//import _, {  random} from 'lodash';
import minimist from 'minimist';
import {
    rmdInit,
    rmdHandler
} from './modules/plugin/reminder';
import logger2 from './modules/logger2';
import schedule from 'node-schedule';
import node_localStorage2 from 'node-localstorage';
import dayjs from 'dayjs';
import broadcast from './modules/broadcast';
import antiBiliMiniApp from './modules/plugin/antiBiliMiniApp';
import logError from './modules/logError';
import NodeCache from 'node-cache';
import path from 'path';
import fs from 'fs';
import JOIN from 'path'
const join = JOIN.join;


//常量
const node_localStorage = node_localStorage2.LocalStorage;
const qiandaosuo = new node_localStorage('../qiandaosuo'); //跨插件签到锁，转推时禁止签到
const ocrspace = new node_localStorage('./ocrspace');
const ascii2dday = new node_localStorage('./ascii2dday');
const qiandaotu = new node_localStorage('./qiandaotu');
const setting = config.picfinder;
const rand = RandomSeed.create();
const searchModeOnReg = new RegExp(setting.regs.searchModeOn);
const searchModeOffReg = new RegExp(setting.regs.searchModeOff);
const signReg = new RegExp(setting.regs.sign);
const signReg2 = new RegExp(setting.regs.sign2);
const huluezifu = setting.replys.huluezifu;
const bangzhuzhiling1 = setting.replys.bangzhuzhiling1;
const bangzhuzhiling2 = setting.replys.bangzhuzhiling2;
const mingling1 = setting.replys.mingling1;
const mingling2 = setting.replys.mingling2;
const qiandaoxianzhishu = setting.sign.qiandaoxianzhishu;
const chouqianxianzhishu = setting.sign.chouqianxianzhishu;
const signdelay = setting.sign.delay * 1000;
var qiandaotupianjishu = 0; //签到总数限制
var chouqiantupianjishu = 0; //抽签总数限制
const cache2 = new NodeCache({
    stdTTL: 1 * 180 //秒
});
const cache3 = new NodeCache({
    stdTTL: 1 * 2 //秒
});
//初始化
var pic1 = -1;
const pfcache = setting.cache.enable ? new PFCache() : null;
const logger = new Logger();
let t = new Date();
logger2.info('搜图插件,' + t.toString() + dayjs(t.toString()).format(' A 星期d'));

/**
 * 
 * @param startPath  起始目录文件夹路径
 * @returns {Array}
 */
//https://www.imooc.com/wenda/detail/459466 nodejs的FS或path如何获取某文件夹下的所有文件的文件名呢。
function findSync(startPath) {
    let result = [];

    function finder(path) {
        let files = fs.readdirSync(path);
        files.forEach((val, index) => {
            let fPath = join(path, val);
            let stats = fs.statSync(fPath);
            //if(stats.isDirectory()) finder(fPath);
            if (stats.isFile()) {
                //logger.info(fPath);
                result.push(fPath);
            }
        });
    }
    finder(startPath);
    return result;
}

async function start() {
    if (setting.akhr.enable) Akhr.init().catch(console.error);
    if (setting.reminder.enable) rmdInit(replyMsg);
    pic1 = await new Promise(function (resolve, reject) {
        resolve(findSync('./tuku').length - 1);
    });

    logger2.info("签到图数：" + pic1);

    //好友请求
    bot.on('request', context => {
        if (context.request_type === 'friend') {
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
                    let t = new Date();
                    logger2.info(t.toString() + ",好友申请:" + e);
                    approve = false;
                }
            }
            if (approve)
                bot('set_friend_add_request', {
                    flag: context.flag,
                    sub_type: 'invite',
                    approve: true,
                });
        }
    });

    //加群请求
    const groupAddRequests = {};
    bot.on('request', context => {
        if (context.request_type === 'group') {
            if (context.sub_type === 'invite') {
                if (setting.autoAddGroup)
                    bot('set_group_add_request', {
                        flag: context.flag,
                        approve: true,
                    });
                else groupAddRequests[context.group_id] = context.flag;
            }
        }
    });

    //管理员指令
    bot.on('message', context => {
        if (context.message_type == "private") {
            if (context.user_id != setting.admin) return false;
            const args = parseArgs(context.message);

            //允许加群
            const group = args['add-group'];
            if (group && typeof group == 'number') {
                if (typeof groupAddRequests[context.group_id] == 'undefined') {
                    replyMsg(context, `将会同意进入群${group}的群邀请`);
                    //注册一次性监听器
                    bot.once('request', context2 => {
                        if (context2.request_type === 'group') {
                            if (context2.sub_type === 'invite') {
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
                            }
                        }
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

            if (args.broadcast) broadcast(bot, parseArgs(context.message, false, 'broadcast')); //群发消息功能

            //Ban
            const {
                'ban-u': bu,
                'ban-g': bg
            } = args;
            if (bu && typeof bu == 'number') {
                Logger.ban('u', bu);
                replyMsg(context, `已封禁用户${bu}`);
            }
            if (bg && typeof bg == 'number') {
                Logger.ban('g', bg);
                replyMsg(context, `已封禁群组${bg}`);
            }

            //明日方舟
            if (args['update-akhr'])
                Akhr.updateData()
                .then(() => replyMsg(context, '方舟公招数据已更新'))
                .catch(e => {
                    logError(e);
                    let t = new Date();
                    logger2.info(t.toString() + ",方舟公招数据更新:" + e);
                    replyMsg(context, '方舟公招数据更新失败，请查看错误日志');
                });

            //停止程序（利用pm2重启）
            if (args.shutdown) {
                replyMsg(context, '搜图已关闭！');
                process.exit(); //并没有使用pm2
            }
        }
    });

    //设置监听器
    if (setting.debug) {
        //私聊
        if (setting.enablePM) {
            bot.on('message', debugRrivateAndAtMsg);
        }
        //讨论组@
        //bot.on('message.discuss.@me', debugRrivateAndAtMsg);
        //群组@
        if (setting.enableGM) {
            bot.on('message', debugGroupMsg);
        }
    } else {
        //私聊
        if (setting.enablePM) {
            bot.on('message', privateAndAtMsg);
        }
        //讨论组@
        //bot.on('message.discuss.@me', privateAndAtMsg);
        //群组@
        //群组
        if (setting.enableGM) {
            bot.on('message', groupMsg);
        }
    }

    //连接相关监听
    bot('get_status').then(data1 => {
        bot('get_version_info').then(data2 => {
            //https://www.jb51.net/article/134067.htm js保留两位小数方法总结
            let stats = `
接受包: ${data1.stat.packet_received} ， 发送包: ${data1.stat.packet_sent} ， 丢包: ${data1.stat.packet_lost} ， 丢包率：${(data1.stat.packet_lost/(data1.stat.packet_lost+data1.stat.packet_sent)*100).toFixed(3)}%
接受消息: ${data1.stat.message_received} ， 发送消息: ${data1.stat.message_sent}
断开链接: ${data1.stat.disconnect_times} ， 丢失: ${data1.stat.lost_times}`;
            logger2.info("get_status: " + JSON.stringify(data1) + "\n" + "get_version_info" + JSON.stringify(data2))
            logger2.info("go-cqhttp在线中：" + data1.online + "\n" + "go-cqhttp版本：" + data2.version + "\n" + "cqhttp插件正常运行中：" + data1.app_good + "\n" + "go语言版本：" + data2.runtime_version + "\n" + "cqhttp版本：" + data2.plugin_version + "\n" + "搜图插件版本：" + version + "\n数据统计：" + stats)
            bot('send_private_msg', {
                user_id: setting.admin,
                message: "搜图插件已启动\ngo-cqhttp在线中：" + data1.online + "\n" + "go-cqhttp版本：" + data2.version + "\n" + "cqhttp插件正常运行中：" + data1.app_good + "\n" + "go语言版本：" + data2.runtime_version + "\n" + "cqhttp版本：" + data2.plugin_version + "\n" + "搜图插件版本：" + version + "\n数据统计：" + stats
            });
        }).catch(err => {
            logger.error(new Date().toString() + "get_status:" + JSON.stringify(err));
        });
    }).catch(err => {
        logger.error(new Date().toString() + "get_version_info:" + JSON.stringify(err));
    });
    /*.then(data => {}).catch(err => {
            logger2.error(new Date().toString() + "," + err);
            logger2.error("未连接上go-cqhttp，退出程序 ");
            process.exit();
        });*/
    //http://nodejs.cn/learn/how-to-exit-from-a-nodejs-program 如何从 Node.js 程序退出

    //自动帮自己签到（诶嘿
    //以及每日需要更新的一些东西
    //setInterval(() => {
    //logger2.info("管理员签到1");
    //if (bot.isReady() && logger.canAdminSign()) { //
    //logger2.info("管理员签到2");
    //setTimeout(() => {
    /*if (setting.admin > 0 && logger.canSign(setting.admin) == true) {
        //logger2.info("管理员签到3");
    }*/
    //更新明日方舟干员数据
    //      if (setting.akhr.enable) Akhr.updateData();
    //    }, 60 * 1000);
    //  }
    //}, 60 * 60 * 1000);

    //通用处理
    function commonHandle(context) {
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
            /*
            {"app_enabled":true,"app_good":true,"app_initialized":true,"good":true,"online":true,"plugins_good":null}
{"coolq_directory":"/home/user/coolq/gocqhttp","coolq_edition":"pro","go-cqhttp":true,"plugin_build_configuration":"release","plugin_build_number":99,"plugin_version":"4.15.0","runtime_os":"linux","runtime_version":"go1.14.7"}
{"app_enabled":true,"app_good":true,"app_initialized":true,"good":true,"online":true,"plugins_good":null,"stat":{"packet_received":66,"packet_sent":62,"packet_lost":2,"message_received":0,"message_sent":1,"disconnect_times":0,"lost_times":0}},"retcode":0,"status":"ok"}

             */
            bot('get_status').then(data1 => {
                bot('get_version_info').then(data2 => {
                    let stats = `
接受包: ${data1.stat.packet_received} ， 发送包: ${data1.stat.packet_sent} ， 丢包: ${data1.stat.packet_lost} ， 丢包率：${(data1.stat.packet_lost/(data1.stat.packet_lost+data1.stat.packet_sent)*100).toFixed(3)}%
接受消息: ${data1.stat.message_received} ， 发送消息: ${data1.stat.message_sent}
断开链接: ${data1.stat.disconnect_times} ， 丢失: ${data1.stat.lost_times}`;
                    logger2.info("get_status: " + JSON.stringify(data1) + "\n" + "get_version_info" + JSON.stringify(data2))
                    logger2.info("go-cqhttp在线中：" + data1.online + "\n" + "go-cqhttp版本：" + data2.version + "\n" + "cqhttp插件正常运行中：" + data1.app_good + "\n" + "go语言版本：" + data2.runtime_version + "\n" + "cqhttp版本：" + data2.plugin_version + "\n" + "搜图插件版本：" + version + "\n数据统计：" + stats)
                    replyMsg(context, "go-cqhttp在线中：" + data1.online + "\n" + "go-cqhttp版本：" + data2.version + "\n" + "cqhttp插件正常运行中：" + data1.app_good + "\n" + "go语言版本：" + data2.runtime_version + "\n" + "cqhttp版本：" + data2.plugin_version + "\n" + "搜图插件版本：" + version + "\n数据统计：" + stats);
                }).catch(err => {
                    logger.error(new Date().toString() + "get_status:" + JSON.stringify(err));
                });
            }).catch(err => {
                logger.error(new Date().toString() + "get_version_info:" + JSON.stringify(err));
            });
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
        // 反哔哩哔哩小程序
        antiBiliMiniApp(context, replyMsg);
        return false;
    }

    //私聊以及群组@的处理
    var privateqq = new Array(); //针对QQ号延时保护

    function privateAndAtMsg(context) {
        let temp = context.message.split("CQ:at,qq=");
        let temp3 = -1;
        // logger2.info(temp.length + ",原始:" + temp);
        if (temp.length == 2) {
            let temp2 = temp[1].split("]");
            //logger2.info(temp2.length + ",原始2:" + temp2[0]);
            if (temp2.length >= 2) {
                temp3 = parseInt(temp2[0]);
            }
        }
        //logger2.info("目标QQ号：" + temp3);
        //限制为好友私聊有效
        if (((context.message_type == "private" /*&& context.sub_type == "friend"*/ ) /* || context.user_id == setting.admin*/ ) || (context.message.toString().search("CQ:at,qq=") != -1 && temp3 == context.self_id && temp3 != -1 && context.message_type == "group")) {
            let uid = context.user_id;
            if (uid) {
                let cacheKeys = [`${uid}-${true}`]; //防御私聊狂刷
                if (cacheKeys.some(key => cache3.has(key))) {
                    return;
                } else {
                    [true].forEach((id, i) => id && cache3.set(cacheKeys[i], true));
                }
            } else {
                return;
            }
            if (commonHandle(context)) {
                //e.stopPropagation();
                return;
            }
            //logger2.info("66666666666666666666666666666");
            //logger2.info(JSON.stringify(context));
            //暂时禁掉几乎所有私聊
            if (context.message == '。搜图') {
                //e.stopPropagation();
                returnmsg(context, 0);
                return;
            }
            if (context.message == 'ocr' || context.message == 'OCR') {
                //e.stopPropagation();
                returnmsg(context, 1);
                return;
            }
            if (hasImage(context.message)) {
                //搜图
                //e.stopPropagation();
                searchImg(context);
                /*} else if (signReg.exec(context.message)) {
                    //签到
                    //e.stopPropagation();
                    if (logger.canSign(context.user_id)) {
                        bot('send_like', {
                            user_id: context.user_id,
                            times: 10,
                        });
                        return setting.replys.sign;
                    } else return setting.replys.signed;*/
            } else if (context.message.toString().search('--') != -1) {
                return;
            } else if (!context.group_id && !context.discuss_id) {
                const db = snDB[context.message];
                if (db) {
                    logger.smSwitch(0, context.user_id, true);
                    logger.smSetDB(0, context.user_id, db);
                    replyMsg(context, `已临时切换至[${context.message}]搜图模式√`);
                    return;
                } else {
                    if (context.message_type == 'private') {
                        let ss = context.message;
                        let has = false;
                        for (let i = 0; i < huluezifu.length; i++) {
                            if (ss == huluezifu[i]) {
                                has = true;
                                break;
                            }
                        }
                        if (has == false) {
                            //e.stopPropagation();
                            if (privateqq[context.user_id.toString()] == null) {
                                privateqq[context.user_id.toString()] = true;
                                let t = setTimeout(() => {
                                    clearTimeout(t);
                                    privateqq[context.user_id.toString()] = null;
                                }, 60000);
                                if (context.sub_type == "friend") {
                                    replyMsg(context, setting.replys.default);
                                } else {
                                    replyMsg(context, setting.replys.bangzhuzhiling0);
                                }
                            }
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
                        //e.stopPropagation();
                        if (privateqq[context.user_id.toString()] == null) {
                            privateqq[context.user_id.toString()] = true;
                            let t = setTimeout(() => {
                                clearTimeout(t);
                                privateqq[context.user_id.toString()] = null;
                            }, 60000);
                            if (context.sub_type == "friend") {
                                replyMsg(context, setting.replys.default);
                            } else {
                                replyMsg(context, setting.replys.bangzhuzhiling0);
                            }
                        }
                    }
                }
            }
        }
    }

    //调试模式
    function debugRrivateAndAtMsg(context) {
        if (context.message_type == "private" || (context.message.toString().search('CQ:at,qq=') != -1 && context.message_type == "group")) {
            if (context.user_id != setting.admin) {
                //e.stopPropagation();
                replyMsg(context, setting.replys.debug);
                return;
            }
            logger2.info(`${getTime()} 私聊消息:` + context.message);
            return privateAndAtMsg(context);
        }
    }

    function debugGroupMsg(context) {
        if (context.message_type == "group") {
            if (context.user_id != setting.admin) {
                //e.stopPropagation();
                return;
            } else {
                logger2.info(`${getTime()} 群组消息:` + context.message);
                return groupMsg(context);
            }
        }

    }

    //群组消息处理
    var qiandaoxianzhi = false;

    function groupMsg(context) {
        if (context.message_type == "group") {
            //logger2.info(JSON.stringify(context));
            let uid = context.user_id;
            let cacheKeys = `${uid}`; //防御群聊狂刷，计数制
            let cacheKeys2 = [`${uid}-${true}`]; //防御群聊狂刷，延时2秒
            if (uid) {
                if ( /*cache2.has(cacheKeys)*/ cache2.get(cacheKeys) == 0) {
                    return;
                }
                if (cacheKeys2.some(key => cache3.has(key))) {
                    return;
                } else {
                    [true].forEach((id, i) => id && cache3.set(cacheKeys2[i], true));
                }
                //logger2.info(uid + ": " + cache2.get(cacheKeys));
            } else {
                return;
            }
            if (commonHandle(context)) {
                //e.stopPropagation();
                return;
            }
            if (context.message == '。搜图') {
                //e.stopPropagation();
                cache(uid, true);
                returnmsg(context, 0);
                return;
            }
            if (context.message == 'ocr' || context.message == 'OCR') {
                //e.stopPropagation();
                cache(uid, true);
                returnmsg(context, 1);
                return;
            }
            if (signReg.exec(context.message)) {
                //签到
                //e.stopPropagation();
                let blackgroup = false;
                let blackgroup2 = setting.sign.blackgroup;
                let i = 0;
                for (i = 0; i < blackgroup2.length; i++) {
                    if (context.group_id == blackgroup2[i]) {
                        blackgroup = true;
                        break;
                    }
                }

                if (qiandaoxianzhi == false && (qiandaosuo.getItem("qiandaosuo") == "false" || qiandaosuo.getItem("qiandaosuo") == undefined) && blackgroup == false) {
                    qiandaoxianzhi = true;
                    let t = setTimeout(() => {
                        clearInterval(t);
                        qiandaoxianzhi = false;
                    }, signdelay);
                    cache(uid, true);
                    let temp = qiandaotu.getItem('jishu');
                    let pictemp = null;
                    let temp2=0;
                    if (pic1 != -1) {
                        if (temp == null || parseInt(temp) == pic1) {
                            qiandaotu.setItem('jishu', "0");
                        } else {
                            temp2 = parseInt(qiandaotu.getItem('jishu'));
                            temp2++;
                            qiandaotu.setItem('jishu', temp2);
                        }
                        pictemp = path.join(__dirname, "./tuku/" + qiandaotu.getItem('jishu').toString() + ".jpg");
                    }
                    qiandaotupianjishu++;
                    logger2.info("签到最大限制数(-1等于不限制)：" + qiandaoxianzhishu);
                    logger2.info("签到数：" + qiandaotupianjishu);
                    if (qiandaotupianjishu <= qiandaoxianzhishu || qiandaoxianzhishu == -1) { //签到总数限制
                        if (logger.canSign(context.user_id)) {
                            if (pictemp != null) {
                                replyMsg(context, `[CQ:at,qq=${context.user_id}]` + setting.replys.sign + `\n[CQ:image,file=file:///${pictemp}]\n`+temp2)
                            } else {
                                replyMsg(context, `[CQ:at,qq=${context.user_id}]` + setting.replys.sign);
                            }
                            return true;
                        }
                        if (pictemp != null) {
                            replyMsg(context, `[CQ:at,qq=${context.user_id}]` + setting.replys.signed + `\n[CQ:image,file=file:///${pictemp}]\n`+temp2)
                        } else {
                            replyMsg(context, `[CQ:at,qq=${context.user_id}]` + setting.replys.signed);
                        }
                    }
                    return true;
                }
            } else if (signReg2.exec(context.message)) {
                //抽签
                //e.stopPropagation();
                let blackgroup = false;
                let blackgroup2 = setting.sign.blackgroup;
                let i = 0;
                for (i = 0; i < blackgroup2.length; i++) {
                    if (context.group_id == blackgroup2[i]) {
                        blackgroup = true;
                        break;
                    }
                }

                if (qiandaoxianzhi == false && (qiandaosuo.getItem("qiandaosuo") == "false" || qiandaosuo.getItem("qiandaosuo") == undefined) && blackgroup == false) {
                    qiandaoxianzhi = true;
                    let t = setTimeout(() => {
                        clearInterval(t);
                        qiandaoxianzhi = false;
                    }, signdelay);
                    cache(uid, true);
                    let temp = getIntRand(pic1);
                    let pictemp = null;
                    if (temp != -1) {
                        pictemp = path.join(__dirname, "./tuku/" + temp.toString() + ".jpg");
                    }
                    chouqiantupianjishu++;
                    logger2.info("抽签最大限制数(-1等于不限制)：" + chouqianxianzhishu);
                    logger2.info("抽签数：" + chouqiantupianjishu);
                    if (chouqiantupianjishu <= chouqianxianzhishu || chouqianxianzhishu == -1) { //抽签总数限制
                        if (pictemp != null) {
                            replyMsg(context, setting.replys.sign2 + `\n[CQ:image,file=file:///${pictemp}]\n`+temp, true, true)
                        } else {
                            replyMsg(context, "未找到图片！", true, true);
                        }
                    }
                    return true;
                }
            }
            //进入或退出搜图模式
            const {
                group_id,
                user_id
            } = context;

            if (searchModeOnReg.exec(context.message)) {
                //进入搜图
                //e.stopPropagation();
                cache(uid, true);
                if (
                    logger.smSwitch(group_id, user_id, true, () => {
                        replyMsg(context, setting.replys.searchModeTimeout, true);
                    })
                )
                    replyMsg(context, setting.replys.searchModeOn, true);
                else replyMsg(context, setting.replys.searchModeAlreadyOn, true);
            } else if (searchModeOffReg.exec(context.message)) {
                //e.stopPropagation();
                //退出搜图
                cache(uid, true);
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
                    //e.stopPropagation();
                    searchImg(context, smStatus);
                }

            } else if (setting.repeat.enable) {
                //复读（
                //随机复读，rptLog得到当前复读次数
                cache(uid, true);
                if (logger.rptLog(group_id, user_id, context.message) >= setting.repeat.times && getRand() <= setting.repeat.probability) {
                    logger.rptDone(group_id);
                    //延迟2s后复读
                    let t = setTimeout(() => {
                        clearTimeout(t);
                        replyMsg(context, context.message);
                    }, 2000);
                } else if (getRand() <= setting.repeat.commonProb) {
                    //平时发言下的随机复读
                    let t = setTimeout(() => {
                        clearTimeout(t);
                        replyMsg(context, context.message);
                    }, 2000);
                }
            }
        }
    }

    function cache(uid, cache = false) {
        if (cache == true) {
            if (cache2.get(uid) == undefined) {
                cache2.set(uid, 20);
            } else {
                let temp = cache2.get(uid) - 1;
                cache2.set(uid, temp);
            }
            logger2.info(uid + ": " + cache2.get(uid));
        }
    }
    //通用信息发送
    function returnmsg(context, xuanze) {
        //console.log(context);
        switch (xuanze) {
            case 0:
                if (context.message_type == 'group') {
                    replyMsg(context, `[CQ:at,qq=${context.user_id}]\n` + bangzhuzhiling1);
                } else if (context.message_type == 'private') {
                    replyMsg(context, bangzhuzhiling1);
                    for (let i = 0; i < mingling1.length; i++) {
                        replyMsg(context, mingling1[i]);
                    }
                }
                break;
            case 1:
                if (context.message_type == 'group') {
                    replyMsg(context, `[CQ:at,qq=${context.user_id}]\n` + bangzhuzhiling2);
                    for (let i = 0; i < mingling2.length; i++) {
                        replyMsg(context, mingling2[i]);
                    }
                } else if (context.message_type == 'private') {
                    replyMsg(context, bangzhuzhiling2);
                    for (let i = 0; i < mingling2.length; i++) {
                        replyMsg(context, mingling2[i]);
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
    var searchImgqq = new Array(); //针对搜图的延时保护，以QQ号为单位
    async function searchImg(context, customDB = -1) {
        const args = parseArgs(context.message);
        const hasWord = word => context.message.indexOf(word) !== -1;
        if (searchImgqq[context.user_id.toString()] == null) {
            searchImgqq[context.user_id.toString()] = true;
            let t = setTimeout(() => {
                clearTimeout(t);
                searchImgqq[context.user_id.toString()] = null;
            }, 15 * 1000);
        } else {
            return;
        }
        //OCR
        if (args.ocr) {
            doOCR(context);
            return;
        }

        //明日方舟
        if (hasWord('akhr') || hasWord('公招')) {
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
                //return;
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
        //var pic_m = false;
        var jishu = 0;
        var tupianshu = imgs.length;
        var tupianshu2 = imgs.length;
        //ascii2d
        let whitegroup = false;
        let whitegroup2 = setting.a2dwhitegroup;
        let whiteqq = false;
        let whiteqq2 = setting.a2dwhiteqq;
        let blackgroup2 = setting.blackgroup;
        let i = 0;
        if (context.message_type == "group") {
            for (i = 0; i < whitegroup2.length; i++) {
                if (context.group_id == whitegroup2[i]) {
                    whitegroup = true;
                    break;
                }
            }
            for (i = 0; i < blackgroup2.length; i++) {
                if (context.group_id == blackgroup2[i]) {
                    return;
                }
            }
        } else if (context.message_type == "private") {
            for (i = 0; i < whiteqq2.length; i++) {
                if (context.user_id == whiteqq2[i]) {
                    whitegroup = true;
                    whiteqq = true;
                    break;
                }
            }
        }
        //console.log("本次搜索图片数：" + tupianshu);
        var t = setInterval(async () => {
            if (tupianshu > 0) {
                let img = imgs[imgs.length - tupianshu];
                //console.log(tupianshu);
                tupianshu--;
                //console.log(tupianshu);
                if (args['url']) replyMsg(context, img.url.replace(/\/[0-9]+\//, '//').replace(/\?.*$/, ''), true, true);
                else {
                    //获取缓存
                    let hasCache = false;
                    if (setting.cache.enable && !args.purge) {
                        const cache = await pfcache.getCache(img.file, db);

                        //如果有缓存
                        if (cache) {
                            hasCache = true;
                            //logger2.info(cache.length);
                            //replyMsg(context, `&#91;缓存&#93; ${cmsg}`);
                            for (const cmsg of cache) {
                                //console.log(msg);
                                //replyMsg(context, `&#91;缓存&#93; ${cmsg}`);
                                //logger2.info(cmsg.length);
                                if (cmsg.search("ascii2d") != -1 && (whitegroup == false || whiteqq == false)) {
                                    continue;
                                }
                                replyMsg(context, `${CQ.escape('[缓存]')}${cmsg}\n---`, true, true);

                                //replySearchMsgs(context, `${CQ.escape('[缓存]')}${cmsg}\n---`);
                            }
                            /*if (context.message_type == 'group') {
                                if (pic_m == false) {
                                    replyMsg(context, `[CQ:at,qq=${context.user_id}]\n群里仅显示saucenao和whatanime的搜索结果，完整结果将转发到私聊(非机器人好友无效，需要找人代搜索)`);
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
                                    message: `${CQ.escape('[缓存]')} ${cache[cmsg][0]}`,
                                });
                            }
                            bot('send_private_msg', {
                                user_id: context.user_id,
                                message: `---`,
                            });*/
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
                        }
                    }

                    if (!hasCache) {
                        //let t2 = setTimeout(async() => {
                        //    clearTimeout(t2);
                        //检查搜图次数
                        let searchLimit = logger.canSearch(context.user_id, setting.searchLimit);
                        //console.log(searchLimit);
                        //if (context.user_id != setting.admin && !logger.canSearch(context.user_id, setting.searchLimit)) {
                        if (context.user_id != setting.admin && searchLimit == setting.searchLimit) {
                            replyMsg(context, setting.replys.personLimit + ",今日搜索次数:" + searchLimit.toString());
                            return;
                        }

                        const needCacheMsgs = [];
                        let success = false;
                        let useSaucenao = false;
                        let useAscii2d = args.a2d;
                        let useWhatAnime = args.anime;

                        /*if (context.user_id == setting.admin) {
                            whiteqq = true;
                        }*/
                        //logger2.info(whiteqq + "," + whitegroup);
                        //saucenao
                        if (!useAscii2d) {
                            useSaucenao = true;
                            const saRet = await saucenao(img.url, db, args.debug || setting.debug, whitegroup, whiteqq);
                            if (saRet.success) success = true;
                            if ((setting.useAscii2dWhenLowAcc && saRet.lowAcc && (db == snDB.all || db == snDB.pixiv)) || (setting.useAscii2dWhenQuotaExcess && saRet.excess /*saRet.excess saucenao出错处理*/ ) || args.purge) {
                                useAscii2d = true;
                            }
                            if (saRet.excess) {
                                useWhatAnime = true;
                            } //saRet.excess saucenao出错处理
                            if (!saRet.lowAcc && saRet.msg.indexOf('anidb.net') !== -1) {
                                useWhatAnime = true;
                            }
                            if (db == snDB.anime || args.purge) {
                                useWhatAnime = true;
                            }
                            if (saRet.msg.length > 0) {
                                needCacheMsgs.push(saRet.msg);
                            }
                            //replySearchMsgs(context, saRet.msg, saRet.warnMsg);
                            /*if (context.message_type == 'group') {
                                if (pic_m == false) { //只有在QQ群使用才会发送这条消息
                                    replyMsg(context, `[CQ:at,qq=${context.user_id}]\n群里仅显示saucenao和whatanime的搜索结果，完整结果将转发到私聊(非机器人好友无效，需要找人代搜索)`);
                                    if (imgs.length > 0) {
                                        pic_m = true;
                                    }
                                }
                                //replyMsg(context, `因为搜索到的结果有风险，所以自动转发到私聊`);
                            }*/
                            //改为私聊
                            jishu++; //发送延迟太大还是导致消息排列错位
                            if (useAscii2d == true || useWhatAnime == true) {
                                replyMsg(context, jishu.toString() + "\n" + saRet.msg, true, true);
                                replyMsg(context, saRet.warnMsg);
                                /*bot('send_private_msg', {
                                    user_id: context.user_id,
                                    message: jishu.toString() + "\n" + saRet.msg + saRet.warnMsg,
                                }).catch(err => {
                                    logger2.error(new Date().toString() + ",Saucenao," + err)
                                });*/
                            } else {
                                replyMsg(context, jishu.toString() + "\n" + saRet.msg + "\n" + saRet.warnMsg + "\n---", true, true);
                                /*bot('send_private_msg', {
                                    user_id: context.user_id,
                                    message: jishu.toString() + "\n" + saRet.msg + saRet.warnMsg + "\n---",
                                }).catch(err => {
                                    logger2.error(new Date().toString() + ",Saucenao," + err)
                                });*/
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

                        if (useAscii2d && ( /*context.user_id == setting.admin ||*/ whitegroup == true || whiteqq == true)) {
                            if (ascii2dday.getItem('ascii2d') == null) {
                                ascii2dday.setItem('ascii2d', "1");
                            }
                            if (ascii2dday.getItem('ascii2d') <= setting.ascii2dsuotucishu /*|| context.user_id == setting.admin*/ ) {
                                const {
                                    color,
                                    bovw,
                                    asErr
                                } = await ascii2d(img.url, whitegroup, whiteqq).catch(asErr => ({
                                    asErr,
                                }));
                                let temp = parseInt(ascii2dday.getItem('ascii2d'));
                                temp++;
                                await new Promise(function (resolve, reject) {
                                    resolve(ascii2dday.setItem('ascii2d', temp));
                                });
                                if (asErr) {
                                    const errMsg = (asErr.response && asErr.response.data.length < 50 && `\n${asErr.response.data}`) || '';
                                    replyMsg(context, "\n今日ascii2d使用次数:" + temp + "\n" + `ascii2d 搜索失败${errMsg}`, true, true); //ascii2d因未知原因搜索失败);
                                    /*bot('send_private_msg', {
                                        user_id: context.user_id,
                                        message: "\n今日ascii2d使用次数:" + temp + "\n" + `ascii2d 搜索失败${errMsg}`, //ascii2d因未知原因搜索失败
                                    });*/
                                    //replySearchMsgs(context, `ascii2d 搜索失败${errMsg}`);
                                    logger2.error(`${getTime()} [error] Ascii2d`);
                                    logger2.error(asErr);
                                    //console.error(`${getTime()} [error] Ascii2d`);
                                    //console.error(asErr);
                                } else {
                                    //改为私聊
                                    success = true;
                                    if (useSaucenao == false) {
                                        /*if (context.message_type == 'group') {
                                            if (pic_m == false) { //只有在QQ群使用才会发送这条消息
                                                replyMsg(context, `[CQ:at,qq=${context.user_id}]\n群里仅显示saucenao和whatanime的搜索结果，完整结果将转发到私聊(非机器人好友无效，需要找人代搜索)`);
                                                if (imgs.length > 0) {
                                                    pic_m = true;
                                                }
                                            }
                                            //replyMsg(context, `因为搜索到的结果有风险，所以自动转发到私聊`);
                                        }*/
                                        jishu++;
                                        replyMsg(context, jishu + "\n今日ascii2d使用次数:" + temp + "\n" + color + "\n" + bovw + `\n---`, true, true);
                                        /*bot('send_private_msg', {
                                            user_id: context.user_id,
                                            message: jishu + "\n今日ascii2d使用次数:" + temp + "\n" + color + "\n" + bovw + `\n---`,
                                        }).catch(err => {
                                            logger2.error(new Date().toString() + ",ascii2d," + err)
                                        });*/
                                    } else if (useWhatAnime) {
                                        replyMsg(context, "今日ascii2d使用次数:" + temp + "\n" + color + "\n" + bovw);
                                        /*bot('send_private_msg', {
                                            user_id: context.user_id,
                                            message: "今日ascii2d使用次数:" + temp + "\n" + color + "\n" + bovw,
                                        }).catch(err => {
                                            logger2.error(new Date().toString() + ",ascii2d," + err)
                                        });*/
                                    } else {
                                        replyMsg(context, "今日ascii2d使用次数:" + temp + "\n" + color + "\n" + bovw + `\n---`);
                                        /*bot('send_private_msg', {
                                            user_id: context.user_id,
                                            message: "今日ascii2d使用次数:" + temp + "\n" + color + "\n" + bovw + `\n---`,
                                        }).catch(err => {
                                            logger2.error(new Date().toString() + ",ascii2d," + err)
                                        });*/
                                    }
                                    //replySearchMsgs(context, color, bovw);
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
                                    });*/
                                    //replyMsg(context, color);//什么聊，怎么发
                                    //replyMsg(context, bovw);
                                }
                            } else {
                                logger2.info("ascii2d:" + ascii2dday.getItem('ascii2d'));
                                replyMsg(context, "ascii2d单日可用次数已耗尽！");
                                /*bot('send_private_msg', {
                                    user_id: context.user_id,
                                    message: `ascii2d单日可用次数已耗尽！`,
                                })*/
                            }
                        }

                        //搜番
                        if (useWhatAnime) {
                            const waRet = await whatanime(img.url, args.debug || setting.debug);
                            if (waRet.success) success = true; //搜番成功
                            //改为私聊
                            if (useSaucenao == false) {
                                jishu++;
                                replyMsg(context, jishu.toString() + "\n" + waRet.msg + "\n---", true, true);
                                /*bot('send_private_msg', {
                                    user_id: context.user_id,
                                    message: jishu.toString() + "\n" + waRet.msg + "\n---",
                                }).catch(err => {
                                    logger2.error(new Date().toString() + ",WhatAnime," + err)
                                });*/
                            } else {
                                replyMsg(context, waRet.msg + "\n---");
                                /*bot('send_private_msg', {
                                    user_id: context.user_id,
                                    message: waRet.msg + "\n---",
                                }).catch(err => {
                                    logger2.error(new Date().toString() + ",WhatAnime," + err)
                                });*/
                            }
                            if (waRet.msg.length > 0) {
                                needCacheMsgs.push(waRet.msg);
                            }
                        }
                        if (success == true) {
                            logger.doneSearch(context.user_id);
                        }
                        tupianshu2--;
                        //将需要缓存的信息写入数据库
                        if (setting.cache.enable && success) {
                            await pfcache.addCache(img.file, db, needCacheMsgs);
                        }
                        //}, 1000);
                    }
                }
            } else {
                clearInterval(t);
                let t2 = setInterval(() => {
                    if (tupianshu2 == 0) {
                        clearInterval(t2);
                        let searchLimit = logger.canSearch(context.user_id, setting.searchLimit);
                        replyMsg(context, "今日搜索次数:" + searchLimit.toString());
                        /*bot('send_private_msg', {
                            user_id: context.user_id,
                            message: "今日搜索次数:" + searchLimit.toString(),
                        }).catch(err => {
                            logger2.error(new Date().toString() + ",今日搜索次数," + err)
                        });*/
                    }

                }, 1000);
                //replyMsg(context, "今日搜索次数:" + searchLimit.toString());
            }
        }, 4000);
        /*for (const img of imgs) {
        }*/

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


    var j1 = schedule.scheduleJob('0 0 0 * * *', async function () { //每天0时0分0秒清0。定时器
        let t = new Date();
        logger2.info(t.toString() + dayjs(t.toString()).format(' A 星期d') + ",单日签到总数：" + qiandaotupianjishu)
        qiandaotupianjishu = 0; //一天的签到总数
        logger2.info(t.toString() + dayjs(t.toString()).format(' A 星期d') + ",单日抽签总数：" + chouqiantupianjishu)
        chouqiantupianjishu = 0; //一天的抽签总数
        ocrspace.setItem('day', "0");
        ascii2dday.setItem('ascii2d', "0");
        pic1 = await new Promise(function (resolve, reject) {
            resolve(findSync('./tuku').length - 1);
        });
        logger2.info("签到图数：" + pic1);
        logger2.info('每日累计次数清0, ' + t.toString() + dayjs(t.toString()).format(' A 星期d'));
        bot('get_status').then(data1 => {
            bot('get_version_info').then(data2 => {
                let stats = `
接受包: ${data1.stat.packet_received} ， 发送包: ${data1.stat.packet_sent} ， 丢包: ${data1.stat.packet_lost} ， 丢包率：${(data1.stat.packet_lost/(data1.stat.packet_lost+data1.stat.packet_sent)*100).toFixed(3)}%
接受消息: ${data1.stat.message_received} ， 发送消息: ${data1.stat.message_sent}
断开链接: ${data1.stat.disconnect_times} ， 丢失: ${data1.stat.lost_times}`;
                logger2.info("get_status: " + JSON.stringify(data1) + "\n" + "get_version_info" + JSON.stringify(data2))
                logger2.info("go-cqhttp在线中：" + data1.online + "\n" + "go-cqhttp版本：" + data2.version + "\n" + "cqhttp插件正常运行中：" + data1.app_good + "\n" + "go语言版本：" + data2.runtime_version + "\n" + "cqhttp版本：" + data2.plugin_version + "\n" + "搜图插件版本：" + version + "\n数据统计：" + stats)
                bot('send_private_msg', {
                    user_id: setting.admin,
                    message: "go-cqhttp在线中：" + data1.online + "\n" + "go-cqhttp版本：" + data2.version + "\n" + "cqhttp插件正常运行中：" + data1.app_good + "\n" + "go语言版本：" + data2.runtime_version + "\n" + "cqhttp版本：" + data2.plugin_version + "\n" + "搜图插件版本：" + version + "\n数据统计：" + stats
                });
            }).catch(err => {
                logger.error(new Date().toString() + "get_status:" + JSON.stringify(err));
            });
        }).catch(err => {
            logger.error(new Date().toString() + "get_version_info:" + JSON.stringify(err));
        });
    });
    //j1.cancel();
    function doOCR(context) {
        const msg = context.message;
        const imgs = getImgs(msg);
        let lang = null;
        const langSearch = /(?<=--L=)[a-zA-Z]{2,3}/.exec(msg);
        //console.log(msg);
        //console.log(langSearch);
        if (langSearch) {
            lang = langSearch[0];
        }
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
            let s1 = t.getFullYear() + '-' + (t.getMonth() + 1) + '-mouth'; //不用就不创建记录文件
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
            if (!Akhr.isDataReady()) {
                replyMsg(context, '数据尚未准备完成，请等待一会，或查看日志以检查数据拉取是否出错');
                return;
            }

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
                ocr[setting.akhr.ocr](img.url, 'chs').then(handleWords).catch(handleError);

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
        /*if(msg.search("  ")!=-1)
        {
            Logger.info("可能是替身搜图？");
            return result;//尝试解决"替身"搜图 回复AT机器人的消息搜图
        }*/
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
    function replyMsg(context, msg, at = false, reply = false) {
        if (typeof msg !== 'string' || msg.length === 0) return;
        if (context.message_type !== 'private') {
            msg = `${reply ? CQ.reply(context.message_id) : ''}${at ? CQ.at(context.user_id) : ''}${msg}`;
        }
        switch (context.message_type) {
            case 'private':
                return bot('send_private_msg', {
                    user_id: context.user_id,
                    message: msg,
                }).then(data => {
                    logger2.info(new Date().toString() + "发送到QQ" + JSON.stringify(data))
                }).catch(err => {
                    logger2.error(new Date().toString() + "发送到QQ" + JSON.stringify(err))
                });
            case 'group':
                return bot('send_group_msg', {
                    group_id: context.group_id,
                    message: msg,
                }).then(data => {
                    logger2.info(new Date().toString() + "发送到QQ" + JSON.stringify(data))
                }).catch(err => {
                    logger2.error(new Date().toString() + "发送到QQ" + JSON.stringify(err))
                });
            case 'discuss':
                return bot('send_discuss_msg', {
                    discuss_id: context.discuss_id,
                    message: msg,
                }).then(data => {
                    logger2.info(new Date().toString() + "发送到QQ" + JSON.stringify(data))
                }).catch(err => {
                    logger2.error(new Date().toString() + "发送到QQ" + JSON.stringify(err))
                });
        }
    }

    /**
     * 回复搜图消息
     *
     * @param {object} context 消息对象
     * @param {Array<string>} msgs 回复内容
     */
    function replySearchMsgs(context, ...msgs) {
        msgs = msgs.filter(msg => msg && typeof msg === 'string');
        if (msgs.length === 0) return;
        let promises = [];
        // 是否私聊回复
        if (setting.pmSearchResult) {
            switch (context.message_type) {
                case 'group':
                case 'discuss':
                    if (!context.pmTipSended) {
                        context.pmTipSended = true;
                        replyMsg(context, '搜图结果将私聊发送！', true);
                    }
                    break;
            }
            promises = msgs.map(msg =>
                bot('send_private_msg', {
                    user_id: context.user_id,
                    message: msg,
                })
            );
        } else {
            promises = msgs.map(msg => replyMsg(context, msg));
        }
        return Promise.all(promises);
    }

    /**
     * 生成随机浮点数
     *
     * @returns 0到100之间的随机浮点数
     */
    function getRand() {
        return rand.floatBetween(0, 100);
    }

    /**
     * 生成指定范围随机整数
     *
     * @returns 0到指定值之间的随机整数
     */
    function getIntRand(i) {
        if (i > 0) {
            return rand.intBetween(0, i);
        } else {
            return -1;
        }
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
        if (_key && typeof m[_key] == 'string' && m._.length > 0) {
            m[_key] += ' ' + m._.join(' ');
        }
        return m;
    }
}
start();

/*async function test() {
    let temp2 = await new Promise(function (resolve, reject) {
        resolve(findSync('./tuku').length);  
    });
    console.log(temp2);
}
test();*/
//https://www.imooc.com/wenda/detail/459466 nodejs的FS或path如何获取某文件夹下的所有文件的文件名呢。
/*(fs.exists(imgs[i], function (exists) {
    resolve(exists);
}));*/

//获取项目工程里的图片 https://www.cnblogs.com/bruce-gou/p/6082132.html
/*var fs = require('fs'); //引用文件系统模块
//var image = require("imageinfo"); //引用imageinfo模块

function readFileList(path, filesList) {
    var files = fs.readdirSync(path);
    files.forEach(function(itm, index) {
        var stat = fs.statSync(path + itm);
        if (stat.isDirectory()) {
            //递归读取文件
            readFileList(path + itm + "/", filesList)
        } else {

            var obj = {}; //定义一个对象存放文件的路径和名字
            obj.path = path; //路径
            obj.filename = itm //名字
            filesList.push(obj);
        }

    })

}
var getFiles = {
    //获取文件夹下的所有文件
    getFileList: function(path) {
            var filesList = [];
            readFileList(path, filesList);
            return filesList;
        } //,
        //获取文件夹下的所有图片
        getImageFiles: function (path) {
            var imageList = [];
    
            this.getFileList(path).forEach((item) => {
                var ms = image(fs.readFileSync(item.path + item.filename));
    
                ms.mimeType && (imageList.push(item.filename))
            });
            return imageList;
    
        }
};
//获取文件夹下的所有图片
//getFiles.getImageFiles("./public/");
//获取文件夹下的所有文件
getFiles.getFileList("./public/");*/