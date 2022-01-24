/**
 * 转换 时间
 *
 * @param {number} time
 * @returns 把秒转换为日,时,分,秒
 */
export default time => {
    //var time = 86402;
    var day = 0;//天
    var hour = 0;//时
    var minute = 0;//分
    var second = 0;//秒
    if (time < 3600) {
        console.log("小于3600s");
        minute = Math.trunc(time / 60);
        second = time - (minute * 60);
    }
    else if (time < 86400) {
        console.log("小于1天");
        hour = Math.trunc(time / 3600);
        minute = Math.trunc((time - (hour * 3600)) / 60);
        second = time - (hour * 3600) - (minute * 60);
    }
    else {
        console.log("大于1天");
        day = Math.trunc(time / 86400);
        hour = Math.trunc((time - (day * 86400)) / 3600);
        minute = Math.trunc((time - (day * 86400) - (hour * 3600)) / 60);
        second = time - (day * 86400) - (hour * 3600) - (minute * 60);
    }
    return `${day}天${hour}时${minute}分${second}秒`
};