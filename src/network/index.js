import fetch, { setConfig } from '../utils/fetch/index';
import { getENV } from '../utils/env/index';



// 全局配置baseUrl
const baseUrl = {
    development: 'http://znvedio-dev.com',
    production: 'http://znvedio.com',
    mock: 'http://znvedio-mock.com',
}[getENV()];



export {
    fetch,
    getENV,
    initSetConfig,
    baseUrl,
};
