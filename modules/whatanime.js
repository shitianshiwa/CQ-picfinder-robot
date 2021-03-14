import Axios from './axiosProxy';
//import Request from 'request';
//import Qs from 'querystring';
import CQ from './CQcode';
import config from './config';
import logger2 from './logger2';
//import logError from './logError';


const hosts = config.whatanimeHost;
let hostsI = 0;

const date2str = ({ year, month, day }) => [year, month, day].join('-');
const token = config.whatanimeToken.trim();
const waURL = 'https://api.trace.moe';

//const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36';

/**
 * whatanime搜索
 *
 * @param {string} imgURL
 * @param {boolean} [debug=false]
 * @returns
 */
async function doSearch(imgURL, debug = false) {
    let hostIndex = hostsI++ % hosts.length; //决定当前使用的host
    let msg = config.picfinder.replys.failed; //返回信息
    let success = false;

    function appendMsg(str, needEsc = true) {
        if (typeof str == 'string' && str.length > 0) msg += '\n' + (needEsc ? CQ.escape(str) : str);
    }

    await getSearchResult(imgURL, hosts[hostIndex])
        .then(async ret => {
            if (debug) {
                logger2.info(`\n${getTime()},whatanime[${hostIndex}]:`);
                logger2.info(JSON.stringify(ret.data));
                //console.log(`\n[debug] whatanime[${hostIndex}]:`);
                //console.log(JSON.stringify(ret.data));
            }

            let retcode = ret.code;
            if (retcode == 413) {
                msg = 'WhatAnime：图片体积太大啦，请尝试发送小一点的图片（或者也可能是您发送了GIF，是不支持的噢）';
                return;
            } else if (retcode != 200) {
                msg = ret.data;
                return;
            }

            ret = ret.data;

            let limit = ret.limit; //剩余搜索次数
            let limit_ttl = ret.limit_ttl; //次数重置时间
            if (ret.docs.length == 0) {
                logger2.info(`${getTime()}[out] whatanime[${hostIndex}]:${retcode}\n${JSON.stringify(ret)}`);
                //console.log(`${new Date().toLocaleString()} [out] whatanime[${hostIndex}]:${retcode}\n${JSON.stringify(ret)}`);
                msg = `WhatAnime：当前剩余可搜索次数貌似用光啦！请等待${{ limit_ttl }}秒后再试！`;
                return;
            }

            //提取信息
            let doc = ret.docs[0]; //相似度最高的结果
            let similarity = (doc.similarity * 100).toFixed(2); //相似度
            const {
                title_native: jpName = '', // 日文名
                title_romaji: romaName = '', // 罗马音
                title_chinese: cnName = '', // 中文名
                is_adult: isR18, // 是否 R18
                anilist_id: anilistID, // 番剧 ID
                episode = '-', // 集数
            } = doc;
            const time = (() => {
                const s = Math.floor(doc.at);
                const m = Math.floor(s / 60);
                const ms = [m, s % 60];
                return ms.map(num => String(num).padStart(2, '0')).join(':');
            })();

            await getAnimeInfo(anilistID)
                .then(info => {
                    logger2.info(JSON.stringify(info));

                    let type = info.type;
                    let format = info.format;
                    let startDate = info.startDate;
                    let endDate = info.endDate;
                    let coverImage = info.coverImage;
                    msg = `WhatAnime (${similarity}%)\n该截图出自第${episode}集的${time}`;
                    if (limit <= 3) {
                        appendMsg(`WhatAnime[${hostIndex}]：注意，${limit_ttl}秒内搜索次数仅剩${limit}次`);
                    }
                    if (isR18) {
                        appendMsg(`R18注意！因为是r18动画封面简略图，不予显示`);
                    } else if (similarity >= 90) {
                        appendMsg(CQ.img(coverImage.large), false);
                    } else {
                        appendMsg(`因为相似度不够高，所以简略图不予显示`);
                    }

                    appendMsg(romaName);
                    if (jpName != romaName) appendMsg(jpName);
                    if (cnName != romaName && cnName != jpName) appendMsg(cnName);
                    appendMsg(`类型：${type}-${format}`);
                    appendMsg(`开播：${date2str(startDate)}`);
                    if (endDate.year > 0) appendMsg(`完结：${date2str(endDate)}`);
                    //if (isR18) appendMsg('R18注意！');
                    /*if (!isR18) {
                        appendMsg('动画介绍(英文)：' + info.siteUrl);
                        let num = 1;
                        for (let i = 0; i < info.externalLinks.length; i++) {
                            if (info.externalLinks[i].site == "Official Site") {
                                appendMsg('动画官网' + (num > 1 ? num : "") + '：' + info.externalLinks[i].url);
                                num++;
                            }
                            if (info.externalLinks[i].site == "Twitter") {
                                appendMsg('动画官推：' + info.externalLinks[i].url);
                            }
                        }
                    }*/
                    success = true;
                })
                .catch(e => {
                    appendMsg('获取番剧信息失败');
                    console.error(`${getTime()}[error] whatanime getAnimeInfo ${e}`);
                });

            if (config.picfinder.debug) {
                logger2.info(`\n${getTime()}[whatanime][${hostIndex}]\n${msg}`);
                //console.log(`\n[debug][whatanime][${hostIndex}]\n${msg}`);
            }
        })
        .catch(e => {
            logger2.error(`${getTime()}[error] whatanime[${hostIndex}] ${e}`);
            //logger2.error(`${new Date().toLocaleString()} [error] whatanime[${hostIndex}] ${JSON.stringify(e)}`);
            //console.error(`${new Date().toLocaleString()} [error] whatanime[${hostIndex}] ${JSON.stringify(e)}`);
        });

    return {
        success,
        msg,
    };
}


/**
 * 取得搜番结果
 *
 * @param {string} imgURL 图片地址
 * @param {string} host 自定义whatanime的host
 * @returns Prased JSON
 */
async function getSearchResult(imgURL, host) {
    if (host === 'trace.moe') host = `https://${host}`;
    else if (!/^https?:\/\//.test(host)) host = `http://${host}`;
    let json = {
        code: 200,
        data: {},
    };
    //取得whatanime返回json
    await Axios.get(imgURL, {
        responseType: 'arraybuffer', //为了转成base64
    })
        /*.then(({ data: image }) =>
            Axios.post(`${host}/api/search` + (token ? `?token=${token}` : ''), { image: Buffer.from(image, 'binary').toString('base64') }).then(ret => {
                //Axios.post(`${host}/api/search`, { image: Buffer.from(image, 'binary').toString('base64') }).then(ret => {
                json.data = ret.data;
                if (typeof ret.data === 'string') {
                    json.code = ret.status;
                }
            })
        )*/
        .then(({
            data: image
        }) =>
            Axios.post(`${host}/api/search` + (token ? `?token=${token}` : ''), {
                image: Buffer.from(image, 'binary').toString('base64')
            })).then(ret => {
                json.data = ret.data;
                json.code = ret.status;
            })
        .catch(e => {
            //if (e != 413) {
            //json.code = e.response.status;
            //json.data = e.response.data;
            //logger2.error(`${new Date().toLocaleString()} [error] whatanime ${e}`);
            //console.error(`${new Date().toLocaleString()} [error] whatanime ${e}`);
            //}
            if (e.response) {
                json.code = e.response.status;
                json.data = e.response.data;
                logger2.error(`${getTime()}[error] whatanime ${e}`);
            } else throw e;
        });
    //logger2.info(JSON.stringify(json));
    return json;
}


const animeInfoQuery = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    type
    format
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    coverImage {
      large
    }
  }
}`;

/**
 * 取得番剧信息
 *
 * @param {number} id
 * @returns Prased JSON
 */
function getAnimeInfo(id) {
    return Axios.post('https://graphql.anilist.co', {
        query: animeInfoQuery,
        variables: { id },
    }).then(({ data }) => data.data.Media);
    /*return new Promise((resolve, reject) => {
        //由于axios无法自定义UA会被block，因此使用request
        Request.get(
            waURL + '/info?anilist_id=' + anilistID, {
                headers: {
                    'user-agent': UA,
                },
            },
            (err, res, body) => {
                if (err) reject();
                resolve(JSON.parse(body)[0]);
            }
        );
    });*/
}

function getTime() {
    return new Date().toLocaleString();
}
export default doSearch;