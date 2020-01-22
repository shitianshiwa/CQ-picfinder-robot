import {get } from '../../axiosProxy';
import config from '../../config';

const { defaultLANG, apikey } = config.picfinder.ocr['ocr.space'];

const LANGAlias = {
    ch: 'chs',
    cn: 'chs',
    zh: 'chs',
    zhs: 'chs',
    zht: 'cht',
    en: 'eng',
    jp: 'jpn',
    ko: 'kor',
    fr: 'fre',
    ge: 'ger',
    ru: 'rus',
    chs: 'chs',
    cht: 'cht',
    eng: 'eng',
    jpn: 'jpn',
    kor: 'kor',
    fre: 'fre',
    ger: 'ger',
    rus: 'rus',
};

/**
 * OCR 识别
 *
 * @param {string} url 图片地址
 * @param {string} [lang=defaultLANG] 语言
 * @returns
 */
function ocr(replyMsg, context, url, lang) {
    let temp = LANGAlias[lang];
    if (temp == null) {
        replyMsg(context, 'OCR识别输入参数错误，自动采用日语作为参数');
    }
    /*if (lang == null) {
        lang = defaultLANG;
    }*/
    console.log(LANGAlias[lang]);
    console.log(lang);
    return get(`https://api.ocr.space/parse/imageurl?apikey=${apikey || 'helloworld'}&url=${encodeURIComponent(url)}&language=${temp /*|| lang*/ || 'jpn'}&scale=${"true"}&OCREngine=${"1"}&FileType=${".Auto"}&isTable=${"false"}`)
        .then((ret) => { /*console.log(JSON.stringify(ret.data));*/ return ret; /*.data.ParsedResults[0].ParsedText.replace(/( *)\r\n$/, '').split('\r\n');*/ });
}
export default ocr;
//ret.data.ParsedResults[0].ParsedText.replace(/( *)\r\n$/, '').split('\r\n');
/*
https://ocr.space/
https://api.ocr.space/parse/image
isOverlayRequired: true 默认值= False
如果为true，则返回每个单词的边界框的坐标。如果为false，则仅以文本块形式返回OCR文本（这使JSON响应更小）。覆盖数据可用于例如在图像上显示文本。
FileType: .Auto [可选]字符串值：PDF，GIF，PNG，JPG，TIF，BMP	覆盖基于content-type的自动文件类型检测。支持的图像文件格式为png，jpg（jpeg），gif，tif（tiff）和bmp。对于文档ocr，该api支持Adobe PDF格式。支持多页TIFF文件。
IsCreateSearchablePDF: false   创建可搜索的PDF
isSearchablePdfHideTextLayer: true 默认值= False。如果为true，则文字层是隐藏的（不可见）
detectOrientation: false 如果设置为true，则api会正确自动旋转图像并 TextOrientation 在JSON响应中设置参数。如果图像未旋转，则TextOrientation = 0，否则为旋转度，例如“ 270”。
isTable: false 进行收据扫描和/或表格识别
scale: true 自动放大内容（建议使用低DPI的内容）
OCREngine: 1 选择要使用的OCR引擎


****** Result for Image/Page 1 ******
Error: Parsing Error: Image dimensions are too large! Max image dimensions supported: 10000 x 10000.
{
    "ParsedResults": [{
        "FileParseExitCode": -10,
        "ParsedText": "",
        "ErrorMessage": "Parsing Error: Image dimensions are too large! Max image dimensions supported: 10000 x 10000.",
        "ErrorDetails": "Image dimensions are too large! Max image dimensions supported: 10000 x 10000."
    }],
    "OCRExitCode": 3,
    "IsErroredOnProcessing": true,
    "ErrorMessage": ["All images/pages errored in parsing"],
    "ProcessingTimeInMilliseconds": "6625",
    "SearchablePDFURL": "Searchable PDF not generated as it was not requested."
}

{"OCRExitCode":99,"IsErroredOnProcessing":true,"ErrorMessage":["Value for parameter 'language' is invalid"],"ProcessingTimeInMilliseconds":"1046"}
*/