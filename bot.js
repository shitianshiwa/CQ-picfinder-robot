import CQHttp from 'cqhttp';
import Config from './modules/config';
const config = Config.cqws;
const bot = new CQHttp({
    apiRoot: config.posturl,
    accessToken: config.accessToken
});
bot.listen(config.hostport, config.host);

export default bot;