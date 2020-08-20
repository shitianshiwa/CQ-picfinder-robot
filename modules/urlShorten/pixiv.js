/**
 * pixiv 短链接
 *
 * @export
 * @param {string} url
 * @returns
 */
export default function pixivShorten(url, thumbnail) {
    const pidSearch = /pixiv.+illust_id=([0-9]+)/.exec(url) || /pixiv.+artworks\/([0-9]+)/.exec(url);
    if (pidSearch) return 'Link：https://pixiv.net/i/' + pidSearch[1] + (thumbnail != null ? '\nLook：https://pixiv.cat/' + pidSearch[1] + ".jpg" : '');
    //if (pidSearch) return 'https://pixiv.net/i/' + pidSearch[1];
    const uidSearch = /pixiv.+member\.php\?id=([0-9]+)/.exec(url) || /pixiv.+users\/([0-9]+)/.exec(url);
    if (uidSearch) return 'https://pixiv.net/u/' + uidSearch[1] + (thumbnail != null ? '\nLook: https://pixivic.com/artist/' + uidSearch[1] : '');
    return url;
}
/*
https://github.com/Tsuk1ko/CQ-picfinder-robot/issues/70
https://pixiv.cat/
使用方式
單張作品
適用於一個作品ID中只有一張圖片的作品

連結: https://pixiv.cat/Pixiv作品數字ID.jpg/png/gif

例如: https://pixiv.cat/66002247.jpg

多張作品 (漫畫模式)
適用於一個作品ID中有多張圖片的作品

連結: https://pixiv.cat/Pixiv作品數字ID-第幾張圖.jpg/png/gif

例如: https://pixiv.cat/65978979-2.png

圖片為動態產生，網址結尾副檔名部分無實際用途，準確檔案類型會以 Content-Type header 發送。
*/