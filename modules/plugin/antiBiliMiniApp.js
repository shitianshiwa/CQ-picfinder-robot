import _ from 'lodash';
import {
    get,
    head
} from 'axios';
import {
    stringify
} from 'qs';
import NodeCache from 'node-cache';
import CQ from '../CQcode';
import logError from '../logError';
import config from '../config';
import logger2 from '../logger2';
import dayjs from 'dayjs';
import parseJSON from '../utils/parseJSON';

//const param={aid:"2",bvid:"BV1xx411c7mD"}
//不能反json格式的bili分享小程序(已修？)
//https://api.bilibili.com/x/web-interface/view?bvid=BV1Kk4y1U7DW
//https://api.bilibili.com/x/web-interface/view?aid=754167434
const setting = config.picfinder.antiBiliMiniApp;
const sessdata = setting.sessdata; //用来得到获取视频信息的权限
const cache = new NodeCache({
    stdTTL: 1 * 60
});
const fenqu = {
    1: "动画",
    24: "动画-MAD·AMV mad", //:\n具有一定制作程度的动画或静画的二次创作视频
    25: "动画-MMD·3D mmd", //:\n使用MMD（MikuMikuDance）和其他3D建模类软件制作的视频
    47: "动画-短片·手书", //:\n追求创新并具有强烈特色的短片、手书（绘）及ACG相关配音
    86: "动画-特摄", //:\n特摄相关衍生视频
    27: "动画-综合", //:\n以动画及动画相关内容为素材，包括但不仅限于音频替换、杂谈、排行榜等内容


    13: "番剧",
    33: "番剧-连载动画", //:\n当季连载的动画番剧
    32: "番剧-完结动画", //:\n已完结的动画番剧合集
    51: "番剧-资讯", //:\n动画番剧相关资讯视频
    152: "番剧-官方延伸", //:\n动画番剧为主题的宣传节目、采访视频，及声优相关视频

    167: "国创",
    153: "国创-国产动画:",
    168: "国创-国产原创相关:",
    169: "国创-布袋戏:",
    195: "国创-动态漫·广播剧:",
    170: "国创-资讯:",

    3: "音乐",
    28: "音乐-原创音乐", //:\n个人或团队制作以音乐为主要原创因素的歌曲或纯音乐
    31: "音乐-翻唱", //:\n一切非官方的人声再演绎歌曲作品
    30: "音乐-VOCALOID·UTAU", //:\n以雅马哈Vocaloid和UTAU引擎为基础，包含其他调教引擎，运用各类音源进行的歌曲创作内容
    194: "音乐-电音", //:\n以电子合成器、音乐软体等产生的电子声响制作的音乐
    59: "音乐-演奏", //:\n传统或非传统乐器及器材的演奏作品
    193: "音乐-MV", //:\n音乐录影带，为搭配音乐而拍摄的短片
    29: "音乐-音乐现场", //:\n音乐实况表演视频
    130: "音乐-音乐综合", //:\n收录无法定义到其他音乐子分区的音乐视频

    129: "舞蹈",
    20: "舞蹈-宅舞", //:\n与ACG相关的翻跳、原创舞蹈
    198: "舞蹈-街舞", //:\n收录街舞相关内容，包括赛事现场、舞室作品、个人翻跳、FREESTYLE等
    199: "舞蹈-明星舞蹈", //:\n国内外明星发布的官方舞蹈及其翻跳内容
    200: "舞蹈-中国舞", //:\n传承中国艺术文化的舞蹈内容，包括古典舞、民族民间舞、汉唐舞、古风舞等
    154: "舞蹈-舞蹈综合", //:\n收录无法定义到其他舞蹈子分区的舞蹈视频
    156: "舞蹈-舞蹈教程", //:\n镜面慢速，动作分解，基础教程等具有教学意义的舞蹈视频

    4: "游戏",
    17: "游戏-单机游戏", //:\n以所有平台（PC、主机、移动端）的单机或联机游戏为主的视频内容，包括游戏预告、CG、实况解说及相关的评测、杂谈与视频剪辑等
    171: "游戏-电子竞技", //:\n具有高对抗性的电子竞技游戏项目，其相关的赛事、实况、攻略、解说、短剧等视频
    172: "游戏-手机游戏", //:\n以手机及平板设备为主要平台的游戏，其相关的实况、攻略、解说、短剧、演示等视频
    65: "游戏-网络游戏", //:\n由网络运营商运营的多人在线游戏，以及电子竞技的相关游戏内容。包括赛事、攻略、实况、解说等相关视频
    173: "游戏-桌游棋牌", //:\n桌游、棋牌、卡牌对战等及其相关电子版游戏的实况、攻略、解说、演示等视频
    121: "游戏-GMV", //:\n由游戏素材制作的MV视频。以游戏内容或CG为主制作的，具有一定创作程度的MV类型的视频
    136: "游戏-音游", //:\n各个平台上，通过配合音乐与节奏而进行的音乐类游戏视频
    19: "游戏-Mugen", //:\n以Mugen引擎为平台制作、或与Mugen相关的游戏视频

    36: "知识",
    201: "知识-科学科普", //:\n回答你的十万个为什么
    124: "知识-社科人文(趣味科普人文)", //:\n聊聊财经/社会/法律，看看历史趣闻，品品人文艺术
    207: "知识-财经", //:\n宏观经济分析，证券市场动态，商业帝国故事，知识与财富齐飞~
    208: "知识-校园学习", //:\n老师很有趣，同学多人才，我们都爱搞学习
    209: "知识-职业职场", //:\n职场加油站，成为最有料的职场人
    122: "知识-野生技术协会", //:\n是时候展现真正的技术了
    39: "知识-演讲·公开课", //:\n涨知识的好地方，给爱学习的你
    96: "知识-星海", //:\n军事类内容的圣地
    98: "知识-机械", //:\n机械设备展示或制作视频

    188: "数码",
    95: "数码-手机平板", //:\n手机平板设备相关视频
    189: "数码-电脑装机", //:\n电脑装机及配件等相关视频
    190: "数码-摄影摄像", //:\n摄影摄像器材等相关视频
    191: "数码-影音智能", //:\n影音设备、智能产品等相关视频

    160: "生活",
    138: "生活-搞笑", //:\n搞笑的、轻松有趣的、具有独特笑点或娱乐精神的视频
    21: "生活-日常", //:\n漫展、cosplay、体育运动及其他一般日常向视频
    //76: "生活-美食圈:\n美食鉴赏&料理制作教程",
    75: "生活-动物圈", //:\n这里有各种萌萌哒动物哦
    161: "生活-手工", //:\n简易手工艺品的diy制作视频，例如；折纸、手账、橡皮章等
    162: "生活-绘画", //:\n绘画爱好者们关于绘画技巧、绘图过程的分享交流场所
    163: "生活-运动", //:\n一般向运动项目以及惊险刺激的户外极限运动
    176: "生活-汽车", //:\n专业汽车资讯，分享车生活
    174: "生活-其他", //:\n对于分区归属不明的视频进行归纳整合的特定分区

    211: "美食",
    76: "美食制作(原[生活]->[美食圈])", //\n学做人间美味，展示精湛厨艺
    212: "美食侦探", //\n寻找美味餐厅，发现街头美食
    213: "美食测评", //\n吃货世界，品尝世间美味
    214: "田园美食", //\n品味乡野美食，寻找山与海的味道
    215: "美食记录", //\n记录一日三餐，给生活添一点幸福感

    119: "鬼畜",
    22: "鬼畜-鬼畜调教", //:\n使用素材在音频、画面上做一定处理，达到与BGM一定的同步感
    26: "鬼畜-音MAD", //:\n使用素材音频进行一定的二次创作来达到还原原曲的非商业性质稿件
    126: "鬼畜-人力VOCALOID", //:\n将人物或者角色的无伴奏素材进行人工调音，使其就像VOCALOID一样歌唱的技术
    127: "鬼畜-教程演示", //:\n鬼畜相关的教程演示


    155: "时尚",
    157: "时尚-美妆", //:\n涵盖妆容、发型、美甲等教程，彩妆、护肤相关产品测评、分享等
    158: "时尚-服饰", //:\n服饰风格、搭配技巧相关的展示和教程视频
    164: "时尚-健身", //:\n器械、有氧、拉伸运动等，以达到强身健体、减肥瘦身、形体塑造目的
    159: "时尚-T台", //:\n发布会走秀现场及模特相关时尚片、采访、后台花絮
    192: "时尚-风尚标", //:\n时尚明星专访、街拍、时尚购物相关知识科普

    202: "资讯",
    203: "资讯-热点", //:\n全民关注的时政热门资讯
    204: "资讯-环球", //:\n全球范围内发生的具有重大影响力的事件动态
    205: "资讯-社会", //:\n日常生活的社会事件、社会问题、社会风貌的报道
    206: "资讯-综合", //:\n除上述领域外其它垂直领域的综合资讯

    165: "广告",
    166: "广告-娱乐",

    5: "娱乐",
    71: "娱乐-综艺", //:\n国内外有趣的综艺和综艺相关精彩剪辑
    137: "娱乐-明星", //:\n娱乐圈动态、明星资讯相关
    131: "娱乐-Korea相关", //:\nKorea相关音乐、舞蹈、综艺等视频

    181: "影视",
    182: "影视-影视杂谈", //:\n影视评论、解说、吐槽、科普等
    183: "影视-影视剪辑", //:\n对影视素材进行剪辑再创作的视频
    85: "影视-短片", //:\n追求自我表达且具有特色的短片
    184: "影视-预告·资讯", //:\n影视类相关资讯，预告，花絮等视频


    177: "纪录片",
    37: "纪录片-人文·历史",
    178: "纪录片-科学·探索·自然",
    179: "纪录片-军事",
    180: "纪录片-社会·美食·旅行",

    23: "电影",
    147: "电影-华语电影",
    145: "电影-欧美电影",
    146: "电影-日本电影",
    83: "电影-其他国家",


    11: "电视剧",
    185: "电视剧-国产剧",
    187: "电视剧-海外剧",
};
//https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/info.md
let attr = {
    0: "禁止排行",
    1: "禁止APP推送动态",
    2: "禁止网页输出",
    3: "禁止客户端列表",
    4: "搜索禁止",
    5: "海外禁止",
    6: "禁止被APP端天马列表推荐(限流，代码里确实写着是天马。。！)",
    7: "禁止转载",
    8: "高清视频(视频清晰度>=1080P)",
    9: "PGC稿件(番剧及影视)",
    10: "允许承包",
    11: "番剧",
    12: "内含商业广告",
    13: "限制地区(大多数番剧&影视)",
    14: "禁止其他人添加TAG",
    15: "未知15",
    16: "跳转(番剧及影视av/bv->ep跳转)",
    17: "影视",
    18: "付费",
    19: "推送动态",
    20: "家长模式",
    21: "禁止游客访问和外链跳转(该视频未登录无法观看，且网页限制referer跳转)", //若可见，可能是加了白名单
    22: "未知22",
    23: "未知23",
    24: "合作视频",
    25: "未知25",
    26: "未知26",
    27: "未知27",
    28: "未知28",
    29: "互动视频"
};
//简略数值
function humanNum(num) {
    return num < 10000 ? num : `${(num / 10000).toFixed(1)}万`;
}
//返回视频信息
function getVideoInfo(param, msg, gid, sessdata2 = "", two = false) {
    //获取限制游客和外链需要加 head cookie加b站的 sessdata来获取
    logger2.info(`https://api.bilibili.com/x/web-interface/view?${stringify(param)}`);
    //http://axios-js.com/zh-cn/docs/ axios中文文档|axios中文网
    return get(`https://api.bilibili.com/x/web-interface/view?${stringify(param)}`, {
            headers: {
                'cookie': 'SESSDATA=' + sessdata2 + ';'
            }
        })
        .then(data => {
            //logger2.info(data.data.code);
            logger2.info(new Date().toString());
            if (data.data.code != 0) {
                switch (data.data.code) {
                    case -400:
                        return "请求错误";
                    case -403:
                        if (two == false) {
                            return getVideoInfo(param, msg, gid, sessdata, true);
                        } else {
                            return "访问权限不足";
                        }
                        case -404:
                            return "找不到视频信息";
                        case 62002:
                            return "稿件不可见";
                        default:
                            logger2.info(new Date().toString() + " , " + JSON.stringify(data.data));
                            return null;
                }
            }
            let data1 = data.data.data;
            let data2 = {
                bvid: data1.bvid,
                aid: data1.aid,
                videos: data1.videos,
                tid: data1.tid,
                tname: data1.tname,
                copyright: data1.copyright,
                pic: data1.pic,
                title: data1.title,
                pubdate: data1.pubdate,
                desc: data1.desc,
                attribute: data1.attribute,
                //rights:data.rights.no_reprint,
                //owner
                mid: data1.owner.mid,
                name: data1.owner.name,
                //stat
                view: data1.stat.view,
                danmaku: data1.stat.danmaku,
                reply: data1.stat.reply,
                favorite: data1.stat.favorite,
                coin: data1.stat.coin,
                share: data1.stat.share,
                his_rank: data1.stat.his_rank,
                like: data1.stat.like,
                dynamic: data1.dynamic,
                //dimension
                width: data1.dimension.width,
                height: data1.dimension.height
            }
            if (gid != null) {
                const cacheKeys = [`${gid}-${data2.aid}`, `${gid}-${data2.bvid}`]; //支持分群
                [data2.aid, data2.bvid].forEach((id, i) => id && cache.set(cacheKeys[i], true));
            }
            let sum = 0;
            let s = "";
            let temp = data2.attribute.toString(2); //正整数转成二进制字符串
            logger2.info("attribute:" + data2.attribute);
            logger2.info("1:" + temp);
            let s2 = "";
            //console.log(Object.keys(attr).length);
            //https://www.jianshu.com/p/59c3ca6041fe js 检查字典对象的长度
            for (let i = temp.length - 1; i >= 0; i--) { //要反着取出才是从右到左
                s2 += temp[i];
                if (temp[i] == "1") {
                    if (s != "") {
                        if (sum == 21) {
                            if (two == false) {
                                s = s + " , " + "禁止外链跳转(网页限制referer跳转)";
                            } else {
                                s = s + " , " + attr[sum];
                            }
                        } else {
                            s = s + " , " + attr[sum];
                        }
                    } else {
                        s = s + attr[sum];
                    }
                }
                if (sum < Object.keys(attr).length - 1) { //目前知道30种状态0-29
                    sum++;
                } else {
                    break;
                }
            }
            logger2.info("2:" + s2);
            logger2.info(s);
            let desc2 = data2.desc.replace(/(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g, '').trim(); //trim可以去掉开头结尾的空格
            let dynamic2 = /(#.*?#)+/g.exec(data2.dynamic); //获取动态话题标签
            let dynamic3 = data2.dynamic.replace(/(#.*?#)+/g, "").trim(); //清理动态话题标签
            //1、简介去掉链接并与动态进行比较（都去掉头尾空格），一样取简介；动态去掉动态话题标签与去掉链接的简介进行比较，一样加简介补回话题标签
            /*if(desc2==dynamic.trim())
            {
                console.log("233333333");
            }
            console.log(desc2);
            console.log(dynamic);*/
            return `${CQ.img(data2.pic)}
尺寸: 宽${data2.width}px , 高${data2.height}px
av${data2.aid}
标题：${data2.title}
UP：${data2.name} 空间链接：https://space.bilibili.com/${data2.mid}
视频分区：${fenqu[data2.tid]!=null?fenqu[data2.tid]:data2.tname}
投稿类型: ${data2.copyright==1?" 自制"/*+(no_reprint==1?" 禁止转载":"")*/:" 转载"}  ${data2.his_rank!=0?"历史最高排行: "+data2.his_rank:""}
${s!=""?"视频属性:  "+s:""}
发布时间：${dayjs(new Date(data2.pubdate*1000).toString()).format('YYYY-MM-DD HH:mm:ss 星期d').replace("星期0","星期天")}
${desc2==data2.dynamic.trim()||data2.dynamic==""?"[视频简介/动态]: "+data2.desc:(desc2==dynamic3?"[视频简介/动态]: "+data2.desc+"\n"+dynamic2:"[视频简介]： "+data2.desc+"\n[视频动态]： "+data2.dynamic)}
${humanNum(data2.view)}播放 , ${humanNum(data2.videos)}个分P , ${humanNum(data2.danmaku)}弹幕 , ${humanNum(data2.reply)}评论 , 
${humanNum(data2.favorite)}收藏 , ${humanNum(data2.share)}分享 , ${humanNum(data2.coin)}硬币 , ${humanNum(data2.like)}点赞 
https://www.bilibili.com/video/${data2.bvid}`
        })
        .catch(e => {
            logError(`${new Date().toString()} [error] get bilibili video info ${param},${msg}`);
            logError(e);
            logger2.error(`${new Date().toString()} [error] get bilibili video info ${param}:` + e);
            return null;
        });
}

function getSearchVideoInfo(keyword) {
    return get(`https://api.bilibili.com/x/web-interface/search/all/v2?${stringify({ keyword })}`).then(
        ({
            data: {
                data: {
                    result
                },
            },
        }) => {
            const videos = result.find(({
                result_type: rt
            }) => rt === 'video').data;
            if (videos.length === 0) return null;
            const {
                author,
                aid,
                bvid,
                title,
                pic,
                play,
                video_review
            } = videos[0];
            return `${CQ.img(`http:${pic}`)}
（搜索）av${aid}
${title.replace(/<([^>]+?)[^>]+>(.*?)<\/\1>/g, '$2')}
UP：${author}
${humanNum(play)}播放 ${humanNum(video_review)}弹幕
https://www.bilibili.com/video/${bvid}`;
        }
    );
}
//链接转av和bv号
function getAvBvFromNormalLink(link) {
    if (typeof link !== 'string') return null;
    const search = /bilibili\.com\/video\/(?:[Aa][Vv]([0-9]+)|([Bb][Vv][0-9a-zA-Z]+))/.exec(link);
    //const search = link.match(/bilibili\.com\/video\/(?:[Aa][Vv]([0-9]+)|([Bb][Vv][0-9a-zA-Z]+))/);
    if (search) {
        //    let search2 = /bilibili\.com\/video\/(?:[Aa][Vv]([0-9]+)|([Bb][Vv][0-9a-zA-Z]+))/.exec(search[0]);
        return {
            aid: search[1],
            bvid: search[2]
        };
    }
    return null;
}
//链接转cv号
function getCvFromNormalLink(link) {
    if (typeof link !== 'string') return null;
    const search = /bilibili\.com\/read\/cv([0-9]+)/.exec(link);
    //const search = link.match(/bilibili\.com\/video\/(?:[Aa][Vv]([0-9]+)|([Bb][Vv][0-9a-zA-Z]+))/);
    if (search != null) {
        return search[1];
    }
    return null;
}
//得到b站短链接转长链接等到av，bv号
function getAvBvFromShortLink(shortLink) {
    logger2.info("avbvshortLink: " + shortLink);
    return head(shortLink, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        })
        .then(ret => {
            logger2.info(ret.headers.location);
            return getAvBvFromNormalLink(ret.headers.location)
        })
        .catch(e => {
            logError(`${new Date().toString()} [error] head request bilibili short link ${shortLink}`);
            logError(e);
            logger2.error(`${new Date().toString()} [error] head request bilibili short link ${shortLink}:` + e);
            return null;
        });
}
//得到b站短链接转长链接等到cv号
function getCvFromShortLink(shortLink) {
    logger2.info("cvshortLink: " + shortLink);
    return head(shortLink, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        })
        .then(ret => {
            logger2.info(ret.headers.location);
            return getCvFromNormalLink(ret.headers.location)
        })
        .catch(e => {
            logError(`${new Date().toString()} [error] head request bilibili cv short link ${shortLink}`);
            logError(e);
            logger2.error(`${new Date().toString()} [error] head request bilibili cv short link ${shortLink}:` + e);
            return null;
        });
}
//得到番剧/影视信息
function getMdInfo(md, gid) {
    if (md != null) {
        logger2.info(`https://api.bilibili.com/pgc/review/user?media_id=${md}`);
        return get(`https://api.bilibili.com/pgc/review/user?media_id=${md}`).then(
            ({
                data: {
                    result: {
                        media: {
                            areas: [{
                                name
                            }],
                            cover,
                            new_ep: {
                                index_show
                            },
                            rating: {
                                count,
                                score
                            },
                            share_url,
                            title,
                            type_name
                        },
                    },
                },
            }) => {
                if (gid != null) {
                    const cacheKeys = [`${gid}-${md}`]; //支持分群
                    [md].forEach((id, i) => id && cache.set(cacheKeys[i], true));
                }
                return `${CQ.img(cover)}
标题：${title}
分类：${type_name}
地区：${name}
更新进度：${index_show}
评分人数: ${count} , 评分: ${score}
${share_url}`
            }
        ).catch(e => {
            logError(`${new Date().toString()} [error] get bilibili media info1`);
            logError(e);
            logger2.error(`${new Date().toString()} [error] get bilibili media info1`);
            return getMdInfo2(md, gid);
        });
    }
    return null;
}
//得到专栏信息
function getCvInfo(cv, gid) {
    if (cv != null) {
        logger2.info(`https://api.bilibili.com/x/article/viewinfo?id=${cv}`);
        return get(`https://api.bilibili.com/x/article/viewinfo?id=${cv}`).then(
            ({
                data: {
                    data: {
                        title,
                        author_name
                    },
                },
            }) => {
                if (gid != null) {
                    const cacheKeys = [`${gid}-${cv}`]; //支持分群
                    [cv].forEach((id, i) => id && cache.set(cacheKeys[i], true));
                }
                return `标题：${title}
作者：${author_name}
链接：https://www.bilibili.com/read/cv${cv}`
            }
        ).catch(e => {
            logError(`${new Date().toString()} [error] get bilibili cv info`);
            logError(e);
            logger2.error(`${new Date().toString()} [error] get bilibili cv info`);
            return null;
        });
    }
    return null;
}
//得到专栏信息出错后再尝试
function getMdInfo2(md, gid) {
    if (md != null) {
        logger2.info(`https://api.bilibili.com/pgc/review/user?media_id=${md}`);
        return get(`https://api.bilibili.com/pgc/review/user?media_id=${md}`).then(
            ({
                data: {
                    result: {
                        media: {
                            areas: [{
                                name
                            }],
                            cover,
                            new_ep: {
                                index_show
                            },
                            share_url,
                            title,
                            type_name
                        },
                    },
                },
            }) => {
                if (gid != null) {
                    const cacheKeys = [`${gid}-${md}`]; //支持分群
                    [md].forEach((id, i) => id && cache.set(cacheKeys[i], true));
                }
                return `${CQ.img(cover)}
标题：${title}
分类：${type_name}
地区：${name}
更新进度：${index_show}
${share_url}`
            }
        ).catch(e => {
            logError(`${new Date().toString()} [error] get bilibili media info2`);
            logError(e);
            logger2.error(`${new Date().toString()} [error] get bilibili media info2`);
            return null;
        });
    }
    return null;
}
//得到番剧/影视mid号
function getmedia_id(ssep) {
    let season_id = /ss([0-9]+)/.exec(ssep);
    let ep_id = /ep([0-9]+)/.exec(ssep);
    season_id = season_id != null ? season_id[1] : false;
    ep_id = ep_id != null ? ep_id[1] : false;
    if (season_id) {
        logger2.info(`https://api.bilibili.com/pgc/view/web/season?season_id=${season_id}`);
        return get(`https://api.bilibili.com/pgc/view/web/season?season_id=${season_id}`).then(
            data => {
                //logger2.info(data.data.result.media_id);
                return data.data.result.media_id;
            }
        ).catch(e => {
            logError(`${new Date().toString()} [error] get bilibili mediaid season_id`);
            logError(e);
            logger2.error(`${new Date().toString()} [error] get bilibili mediaid season_id`);
            return null;
        });
    } else if (ep_id) {
        logger2.info(`https://api.bilibili.com/pgc/view/web/season?ep_id=${ep_id}`);
        return get(`https://api.bilibili.com/pgc/view/web/season?ep_id=${ep_id}`).then(data => {
            //logger2.info(data.data.result.media_id);
            return data.data.result.media_id;
        }).catch(e => {
            logError(`${new Date().toString()} [error] get bilibili mediaid ep_id`);
            logError(e);
            logger2.error(`${new Date().toString()} [error] get bilibili mediaid ep_id`);
            return null;
        });
    }
}
//获取av，bv号
async function getAvBvFromMsg(msg) {
    let search;
    if ((search = getAvBvFromNormalLink(msg))) return search;
    if ((search = /(b23|acg)\.tv\/[0-9a-zA-Z]+/.exec(msg))) return getAvBvFromShortLink(`http://${search[0]}`);
    if ((search = /(av|AV|bv|BV)[0-9a-zA-Z]+/.exec(msg))) return getAvBvFromShortLink(`http://www.bilibili.com/video/${search[0]}`); //解析av号
    return null;
}
//获取cv号
async function getCvFromMsg(msg) {
    let search;
    if ((search = /bilibili\.com\/read\/cv([0-9]+)/.exec(msg))) return search[1]; //专栏
    if ((search = /(b23|acg)\.tv\/[0-9a-zA-Z]+/.exec(msg))) return getCvFromShortLink(`http://${search[0]}`);
    if ((search = /(cv|CV)[0-9a-zA-Z]+/.exec(msg))) return getCvFromShortLink(`http://www.bilibili.com/read/${search[0]}`); //解析cv号
    return null;
}
//获取mid号
function getMdFromMsg(msg) {
    let search;
    if ((search = /bilibili\.com\/bangumi\/media\/md([0-9]+)/.exec(msg))) {
        if (search != null) {
            return search[1]; //返回md值
        }
    }
    if ((search = /bilibili\.com\/bangumi\/(media|play)\/(ep[0-9]+|ss[0-9]+)/.exec(msg))) return getmedia_id(search[2]);
    if ((search = /(b23|acg)\.tv\/(ep[0-9]+|ss[0-9]+)/.exec(msg))) return getmedia_id(search[2]);
    return null;
}


//直接获取链接，所以无视小程序变化
async function antiBiliMiniApp(context, replyFunc) {
    const msg = context.message;
    const gid = context.group_id;
    let title1 = null;
    let url = "";
    let title2 = "";
    let xiaochengxu = true;
    //json
    const data = (() => {
        if (msg.includes('com.tencent.miniapp_01') && msg.includes('哔哩哔哩')) {
            logger2.info("json:" + CQ.unescape(msg));
            if (setting.despise) {
                replyFunc(context, CQ.img('https://i.loli.net/2020/04/27/HegAkGhcr6lbPXv.png'));
            }
            return parseJSON(context.message);
        }
    })();
    const qqdocurl = _.get(data, 'meta.detail_1.qqdocurl');
    const title = _.get(data, 'meta.detail_1.desc');
    const zuozhe = _.get(data, 'meta.detail_1.host.nick');
    url = _.get(data, 'meta.detail_1.qqdocurl') || "";
    //logger2.info("2333333333333");
    //xml或者json
    if ((msg.indexOf('com.tencent.structmsg') !== -1 || msg.indexOf('&#91;QQ小程序&#93;') !== -1) && msg.indexOf('哔哩哔哩') !== -1) {
        //xiaochengxu=true;
        logger2.info("xml:" + CQ.unescape(msg));
        if (setting.despise) {
            replyFunc(context, CQ.img('https://i.loli.net/2020/04/27/HegAkGhcr6lbPXv.png'));
        }
        const search = /"desc":"(.+?)"(?:,|})/g.exec(CQ.unescape(msg));
        const jumpUrl = /"jumpUrl":"(.+?)"(?:,|})/.exec(CQ.unescape(msg));
        title2 = /"title":"(.+?)"(?:,|})/.exec(CQ.unescape(msg));
        if (jumpUrl) {
            url = jumpUrl[1].replace(/\\/g, ""); //不是视频
        }
        if (search) title1 = search[1].replace(/\\/g, "");
        //logger2.info("2333333333333");
    }
    if (setting.getVideoInfo && xiaochengxu == true /*&& msg.indexOf('视频') == -1*/ && msg.indexOf('CQ:video') == -1) {
        const param = await getAvBvFromMsg(qqdocurl || CQ.unescape(msg)); //视频
        const param2 = await getMdFromMsg(qqdocurl || CQ.unescape(msg)); //番剧类
        const param3 = await getCvFromMsg(qqdocurl || CQ.unescape(msg)); //专栏
        //logger2.info(param); //可能有null存在
        //logger2.info(param2); //可能有null存在
        //logger2.info(param3); //可能有null存在
        if (param) {
            const {
                aid,
                bvid
            } = param;
            if (gid) {
                let cacheKeys = [`${gid}-${aid}`, `${gid}-${bvid}`]; //支持分群
                if (cacheKeys.some(key => cache.has(key))) {
                    return;
                }
                [aid, bvid].forEach((id, i) => id && cache.set(cacheKeys[i], true));
            }
            const reply = await getVideoInfo(param, msg, gid);
            if (reply != null) {
                replyFunc(context, reply);
                return;
            }
        } else if (param2 != null) { //新增可解析番剧，纪录片，电影，电视剧信息
            if (gid) {
                let cacheKeys = [`${gid}-${param2}`]; //支持分群
                if (cacheKeys.some(key => cache.has(key))) {
                    return;
                }
                [param2].forEach((id, i) => id && cache.set(cacheKeys[i], true));
            }
            let temp = await getMdInfo(param2, gid);
            if (temp != null) {
                replyFunc(context, temp);
                return;
            }
        } else if (param3 != null) {
            if (gid) {
                let cacheKeys = [`${gid}-cv${param3}`]; //支持分群
                //console.log(cacheKeys);
                if (cacheKeys.some(key => cache.has(key))) {
                    return;
                }
                [param3].forEach((id, i) => id && cache.set(cacheKeys[i], true));
            }
            let temp = await getCvInfo(param3, gid);
            if (temp != null) {
                replyFunc(context, temp);
                return;
            }
        }
        //www.bilibili.com / read / cv
        const isBangumi = /(bilibili|www\.bilibili)\.com\/(bangumi|read)|(b23|acg)\.tv\/(ep|ss)/.test(url.replace(/\\\//g, "/")); //true or false 视频，专栏，番剧
        //logger2.info("bangumi:" + isBangumi);
        //console.log("url1:" + url);
        if (isBangumi == true) { //过滤奇怪的b站分享小程序
            //console.log("title2:" + title2);
            let author = "";
            let search2 = CQ.unescape(msg).split('"desc":');
            if (search2.length == 3) {
                author = search2[2].split(",")[0].replace(/"/g, ""); //写不出正则表达式就先这样解决了,获取动态的作者
            } else {
                author = "";
            }
            logger2.info(CQ.unescape(msg));
            //console.log("url:" + url);
            //console.log("author: " + author);
            logger2.info("title2:" + title2 + ",author:" + author + "," + "url:" + url);
            replyFunc(context, title2[0].replace('"title":"', '标题：').replace('"}', '') + "\n作者/内容：" + author + "\n" + url.split("?share_medium=android")[0]); //标题+链接
            return;
        } else if (title && isBangumi == true) {
            const reply = await getSearchVideoInfo(title);
            if (reply) {
                replyFunc(context, "获取到的标题：" + title + "\n作者：" + zuozhe + "\n" + reply);
                return;
            }
        } else if (title1 && isBangumi == true) {
            const reply = await getSearchVideoInfo(title1);
            if (reply) {
                replyFunc(context, "获取到的标题：" + title1 + "\n" + reply); //不知道具体格式，所以找不出作者
                return;
            }
        } else {
            //logger2.info(new Date().toString() + " ,拦截：" + url);
        }
    }
}

export default antiBiliMiniApp;


//https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/video_zone.md
/*视频分区一览
用于通过视频avID判断所在的分区，或推荐分区视频等.......
亦可用于更深male_sign入了解B站的分区

名称	代号	tID	简介	url路由
动画（主分区）	douga	1		/v/douga
MAD·AMV	mad	24	具有一定制作程度的动画或静画的二次创作视频	/v/douga/mad
MMD·3D	mmd	25	使用MMD（MikuMikuDance）和其他3D建模类软件制作的视频	/v/douga/mmd
短片·手书·配音	voice	47	追求创新并具有强烈特色的短片、手书（绘）及ACG相关配音	/v/douga/voice
特摄	tokusatsu	86	特摄相关衍生视频	/v/douga/tokusatsu
综合	other	27	以动画及动画相关内容为素材，包括但不仅限于音频替换、杂谈、排行榜等内容	/v/douga/other
番剧


名称	代号	tID	简介	url路由
番剧（主分区）	anime	13		/anime
连载动画	serial	33	当季连载的动画番剧	/v/anime/serial
完结动画	finish	32	已完结的动画番剧合集	/v/anime/finish
资讯	information	51	动画番剧相关资讯视频	/v/anime/information
官方延伸	offical	152	动画番剧为主题的宣传节目、采访视频，及声优相关视频	/v/anime/offical
国创


名称	代号	tID	简介	url路由
国创（主分区）	guochuang	167		/guochuang
国产动画	chinese	153	我国出品的PGC动画	/v/guochuang/chinese
国产原创相关	original	168		/v/guochuang/original
布袋戏	puppetry	169		/v/guochuang/puppetry
动态漫·广播剧	motioncomic	195		/v/guochuang/motioncomic
资讯	information	170		/v/guochuang/information
音乐


名称	代号	tID	简介	url路由
音乐（主分区）	music	3		/v/music
原创音乐	original	28	个人或团队制作以音乐为主要原创因素的歌曲或纯音乐	/v/music/original
翻唱	cover	31	一切非官方的人声再演绎歌曲作品	/v/music/cover
VOCALOID·UTAU	vocaloid	30	以雅马哈Vocaloid和UTAU引擎为基础，包含其他调教引擎，运用各类音源进行的歌曲创作内容	/v/music/vocaloid
电音	electronic	194	以电子合成器、音乐软体等产生的电子声响制作的音乐	/v/music/electronic
演奏	perform	59	传统或非传统乐器及器材的演奏作品	/v/music/perform
MV	mv	193	音乐录影带，为搭配音乐而拍摄的短片	/v/music/mv
音乐现场	live	29	音乐实况表演视频	/v/music/live
音乐综合	other	130	收录无法定义到其他音乐子分区的音乐视频	/v/music/other
舞蹈


名称	代号	tID	简介	url路由
舞蹈（主分区）	dance	129		/v/dance
宅舞	otaku	20	与ACG相关的翻跳、原创舞蹈	/v/dance/otaku
街舞	hiphop	198	收录街舞相关内容，包括赛事现场、舞室作品、个人翻跳、FREESTYLE等	/v/dance/hiphop
明星舞蹈	star	199	国内外明星发布的官方舞蹈及其翻跳内容	/v/dance/star
中国舞	china	200	传承中国艺术文化的舞蹈内容，包括古典舞、民族民间舞、汉唐舞、古风舞等	/v/dance/china
舞蹈综合	three_d	154	收录无法定义到其他舞蹈子分区的舞蹈视频	/v/dance/three_d
舞蹈教程	demo	156	镜面慢速，动作分解，基础教程等具有教学意义的舞蹈视频	/v/dance/demo
游戏


名称	代号	tID	简介	url路由
游戏（主分区）	game	4		/v/game
单机游戏	stand_alone	17	以所有平台（PC、主机、移动端）的单机或联机游戏为主的视频内容，包括游戏预告、CG、实况解说及相关的评测、杂谈与视频剪辑等	/v/game/stand_alone
电子竞技	esports	171	具有高对抗性的电子竞技游戏项目，其相关的赛事、实况、攻略、解说、短剧等视频	/v/game/esports
手机游戏	mobile	172	以手机及平板设备为主要平台的游戏，其相关的实况、攻略、解说、短剧、演示等视频	/v/game/mobile
网络游戏	online	65	由网络运营商运营的多人在线游戏，以及电子竞技的相关游戏内容。包括赛事、攻略、实况、解说等相关视频	/v/game/online
桌游棋牌	board	173	桌游、棋牌、卡牌对战等及其相关电子版游戏的实况、攻略、解说、演示等视频	/v/game/board
GMV	gmv	121	由游戏素材制作的MV视频。以游戏内容或CG为主制作的，具有一定创作程度的MV类型的视频	/v/game/gmv
音游	music	136	各个平台上，通过配合音乐与节奏而进行的音乐类游戏视频	/v/game/music
Mugen	mugen	19	以Mugen引擎为平台制作、或与Mugen相关的游戏视频	/v/game/mugen
知识（原科技分区）
已改版

新：旧：

名称	代号	tID	简介	url路由
知识（主分区）	technology	36		/v/technology
科学科普	science	201	回答你的十万个为什么	/v/technology/science
社科人文（趣味科普人文）	fun	124	聊聊财经/社会/法律，看看历史趣闻，品品人文艺术	/v/technology/fun
财经	finance	207	宏观经济分析，证券市场动态，商业帝国故事，知识与财富齐飞~	/v/technology/finance
校园学习	campus	208	老师很有趣，同学多人才，我们都爱搞学习	/v/technology/campus
职业职场	career	209	职场加油站，成为最有料的职场人	/v/technology/career
野生技术协会	wild	122	是时候展现真正的技术了	/v/technology/wild
演讲·公开课（目前已下线）	speech_course	39	涨知识的好地方，给爱学习的你	/v/technology/speech_course
星海（目前已下线）	military	96	军事类内容的圣地	/v/technology/military
机械（目前已下线）	mechanical	98	机械设备展示或制作视频	/v/technology/mechanical
数码


名称	代号	tID	简介	url路由
数码（主分区）	digital	188		/v/digital
手机平板	mobile	95	手机平板设备相关视频	/v/digital/mobile
电脑装机	pc	189	电脑装机及配件等相关视频	/v/digital/pc
摄影摄像	photography	190	摄影摄像器材等相关视频	/v/digital/photography
影音智能	intelligence_av	191	影音设备、智能产品等相关视频	/v/digital/intelligence_av
生活
已改版



名称	代号	tID	简介	url路由
生活（主分区）	life	160		/v/life
搞笑	funny	138	搞笑的、轻松有趣的、具有独特笑点或娱乐精神的视频	/v/life/funny
日常	daily	21	漫展、cosplay、体育运动及其他一般日常向视频	/v/life/daily
美食圈	food	76	美食鉴赏&料理制作教程	/v/life/food
动物圈	animal	75	这里有各种萌萌哒动物哦	/v/life/animal
手工	handmake	161	简易手工艺品的diy制作视频，例如；折纸、手账、橡皮章等	/v/life/handmake
绘画	painting	162	绘画爱好者们关于绘画技巧、绘图过程的分享交流场所	/v/life/painting
运动	sports	163	一般向运动项目以及惊险刺激的户外极限运动	/v/life/sports
汽车	automobile	176	专业汽车资讯，分享车生活	/v/life/automobile
其他	other	174	对于分区归属不明的视频进行归纳整合的特定分区	/v/life/other
鬼畜


名称	代号	tID	简介	url路由
鬼畜（主分区）	kichiku	119		/v/kichiku
鬼畜调教	guide	22	使用素材在音频、画面上做一定处理，达到与BGM一定的同步感	/v/kichiku/guide
音MAD	mad	26	使用素材音频进行一定的二次创作来达到还原原曲的非商业性质稿件	/v/kichiku/mad/v/kichiku/mad
人力VOCALOID	manual_vocaloid	126	将人物或者角色的无伴奏素材进行人工调音，使其就像VOCALOID一样歌唱的技术	/v/kichiku/manual_vocaloid
教程演示	course	127	鬼畜相关的教程演示	/v/kichiku/course
时尚


名称	代号	tID	简介	url路由
时尚（主分区）	fashion	155		/v/fashion
美妆	makeup	157	涵盖妆容、发型、美甲等教程，彩妆、护肤相关产品测评、分享等	/v/fashion/makeup
服饰	clothing	158	服饰风格、搭配技巧相关的展示和教程视频	/v/fashion/clothing
健身	aerobics	164	器械、有氧、拉伸运动等，以达到强身健体、减肥瘦身、形体塑造目的	/v/fashion/aerobics
T台	catwalk	159	发布会走秀现场及模特相关时尚片、采访、后台花絮	/v/fashion/catwalk
风尚标	trends	192	时尚明星专访、街拍、时尚购物相关知识科普	/v/fashion/trends
资讯
新分区



名称	代号	tID	简介	url路由
资讯（主分区）	information	202		/v/information
热点	hotspot	203	全民关注的时政热门资讯	/v/information/hotspot
环球	global	204	全球范围内发生的具有重大影响力的事件动态	/v/information/global
社会	social	205	日常生活的社会事件、社会问题、社会风貌的报道	/v/information/social
综合	multiple	206	除上述领域外其它垂直领域的综合资讯	/v/information/multiple
广告
目前已下线



名称	代号	tID	简介	url路由
广告（主分区）	ad	165		/v/ad
广告	ad	166		/v/ad/ad
娱乐


名称	代号	tID	简介	url路由
娱乐（主分区）	ent	5		/v/ent
综艺	variety	71	国内外有趣的综艺和综艺相关精彩剪辑	/v/ent/variety
明星	star	137	娱乐圈动态、明星资讯相关	/v/ent/star
Korea相关	korea	131	Korea相关音乐、舞蹈、综艺等视频	/v/ent/korea
影视


名称	代号	tID	简介	url路由
影视（主分区）	cinephile	181		/v/cinephile
影视杂谈	cinecism	182	影视评论、解说、吐槽、科普等	/v/cinephile/cinecism
影视剪辑	montage	183	对影视素材进行剪辑再创作的视频	/v/cinephile/montage
短片	shortfilm	85	追求自我表达且具有特色的短片	/v/cinephile/shortfilm
预告·资讯	trailer_info	184	影视类相关资讯，预告，花絮等视频	/v/cinephile/trailer_info
纪录片


名称	代号	tID	简介	url路由
纪录片（主分区）	documentary	177		/documentary
人文·历史	history	37		/v/documentary/history
科学·探索·自然	science	178		/v/documentary/science
军事	military	179		/v/documentary/military
社会·美食·旅行	travel	180		/v/documentary/travel
电影


名称	代号	tID	简介	url路由
电影（主分区）	movie	23		/movie
华语电影	chinese	147		/v/movie/chinese
欧美电影	west	145		/v/movie/west
日本电影	japan	146		/v/movie/japan
其他国家	movie	83		/v/movie/movie
电视剧


名称	代号	tID	简介	url路由
电视剧（主分区）	tv	11		/tv
国产剧	mainland	185		/v/tv/mainland
海外剧	overseas	187		/v/tv/overseas

https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/status_number.md

https://api.bilibili.com/x/v2/dm/view?aid=797108991&oid=235524170&type=1
移动端API！
https://api.bilibili.com/x/player.so?id=cid:235524170&aid=797108991
https://github.com/indefined/UserScripts/issues/39
[BLCC]无法读取Bangumi字幕
#39

视频状态数

专栏
https://api.bilibili.com/x/article/viewinfo?id=

番剧 https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/bangumi/info.md
http://api.bilibili.com/pgc/view/web/season?ep_id=
result.cover 番剧封面
result.title番剧标题
result.evaluate 简介
result.link 链接
https://api.bilibili.com/pgc/review/user?media_id=
*/