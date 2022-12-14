import { createRequire } from 'module'; 
const require = createRequire(import.meta.url);
const Mock = require('mockjs');
import logger from './lib/logger.js';
import DataReader from './lib/reader.js';
import { APP_CONFIG, MODE_LOCAL, MODE_SWAGGER, MODE_LOCAL_ONLY, MODE_SWAGGER_ONLY, MODE_PROXY_ONLY } from './config.js'
import Utils from './utils/index.js'
import UtilsProxy from './utils/proxy.js'
import UtilsMockLocal from './utils/mockLocal.js'
import UtilsSwaggerLocal from './utils/swaggerLocal.js'
import UtilsAxios from './utils/axios.js'

const App = {
    dataReader: new DataReader(),
    option: null,
    swaggerLocalMock: null,
    swaggerConfigs: null,
    proxyConfigs: null,
    async init(option, port) {
        this.option = Utils.mergeConfig(option, APP_CONFIG)

        // 输出启动信息
        this.printInitOk()

        // 处理本地是否含有mock文件夹+data.json
        await UtilsMockLocal.handleLocalMock({
            port,
            https: option.https,
            gitignore: option.gitignore,
        })

        // 处理代理配置
        const proxyConfigs = UtilsProxy.handleProxyConfig();
        if (proxyConfigs) {
            this.proxyConfigs = proxyConfigs
        }

        // 处理swaggerConfigs
        this.swaggerConfigs = UtilsSwaggerLocal.handleSwaggerConfigs();
        if (this.swaggerConfigs && this.swaggerConfigs.length) {
            this.swaggerLocalMock = await UtilsSwaggerLocal.init(this.option, this.swaggerConfigs)
        }
    },
    /**
     * 输出启动信息
     */
    printInitOk() {
        const { port, dir, sleep, swaggerUrl, baseUrl, mode, project } = this.option

        logger.info(`Cars-Mock will start with ${mode ? 'mode:' + mode + ', ' : ''}${port ? 'port:' + port + ', ' : ''}${dir ? 'dir:' + dir + ', ' : ''}${baseUrl ? 'baseUrl:' + baseUrl + ', ' : ''}${swaggerUrl ? 'swaggerUrl:' + swaggerUrl + ', ' : ''}${project ? 'project:' + project : ''}`);

        if (sleep) {
            logger.info(`Cars-Mock will return response data after sleep ${sleep}ms with every request`);
        }
    },
    /**
     * 中间件
     * @param {*} ctx
     * @param {*} next
     * @returns
     */
    async getMiddleware(ctx, next) {
        const { sleep, code: globalCode, baseUrl, dir, mode } = this.option;
        let { method, url, header } = ctx.request;
        // 在代理模式下，会把整个url打到mock服务上，需要把域名去掉
        url = url.replace(/http(s?):\/\/[\w\s\.\-_]+/, '')
        // 排除非真实接口请求
        if (url && (url.indexOf('favicon.ico') > -1 || url.indexOf('.js') > -1 || url.indexOf('.css') > -1 || url.indexOf('.jpg') > -1 || url.indexOf('.png') > -1)) {
            return
        }
        // method转大写
        method = method.toUpperCase();
        logger.info('request ', method, ' ', url)

        // 加工ctx
        ctx.set('Access-Control-Allow-Origin', header.origin || '*'); //header.origin
        ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'); // method
        ctx.set('Access-Control-Allow-Credentials', true);
        ctx.set('Access-Control-Allow-Headers', header['access-control-request-headers']);

        // 判断option
        if (method === 'OPTIONS') {
            ctx.body = ''
            return
        }

        // 是否睡眠：如果请求url 是否传入sleep参数，那么优先走它[毫秒数]
        const urlParams = Utils.urlParse(url);
        if (urlParams && urlParams.hasOwnProperty('sleep') && Utils.isNumber(urlParams.sleep)) {
            await Utils.doSleep(parseInt(urlParams.sleep))
        } else {
            await Utils.doSleep(sleep)
        }

        // 获取path
        let path = Utils.handleRequestUrl(url, baseUrl)

        // 本地mock
        const localMockFn = async() => {
            let response = await UtilsMockLocal.getDataFormFileReader(ctx, path, this.dataReader, dir)
            if (response) {
                // 加工ctx
                logger.info('Good！匹配到本地Mock:', path)
                const mockData = Mock.mock(response) || {}; // Mock
                // 自定义Code逻辑
                if (urlParams && urlParams.hasOwnProperty('code') && Utils.isNumber(urlParams.code)) { // url是否传入code=xxx
                    mockData.code = parseInt(urlParams.code)
                } else if (globalCode || globalCode === 0) { // 启动参数是否配置全局code
                    mockData.code = parseInt(globalCode)
                }
                ctx.body = mockData;
                ctx.set('Api-Get-Way', 'LocalMock')
                ctx.set('Api-True-Url', `./mock/xxx.json/${path}`)
                return ctx;
            }
            return null;
        }
        // swaggerMock
        const swaggerMockFn = async() => {
            if (this.swaggerLocalMock) { // 判断是否传入swaggerUrl
                // console.log('this.swaggerLocalMock', path, Utils.urlParse(url))
                for (let projectIndex = 0; projectIndex < this.swaggerConfigs.length; projectIndex++) {
                    const { code, project } = this.swaggerConfigs[projectIndex]
                    // 动态projectName
                    const localMockPath = (path.indexOf(`${project}/`) === 0 ? '' : project + '/') + path
                    // console.log('this.swaggerLocalMock------>', localMockPath, Utils.urlParse(url))
                    response = await this.swaggerLocalMock.getData(localMockPath, Utils.urlParse(url))
                    if (response) {
                        logger.info('Good！匹配到SwaggerLocalMock:', localMockPath)
                        const mockData = Mock.mock(response) || {}; // Mock
                        // 自定义Code逻辑
                        if (urlParams && urlParams.hasOwnProperty('code') && Utils.isNumber(urlParams.code)) { // url是否传入code=xxx
                            mockData.code = parseInt(urlParams.code)
                        } else if (mockData.hasOwnProperty('code') && (code || code === 0)) { // swaggerConfigs中配置code
                            mockData.code = code
                        } else if (globalCode || globalCode === 0) { // 启动参数是否配置全局code
                            mockData.code = parseInt(globalCode)
                        }
                        ctx.body = mockData;
                        ctx.set('Api-Get-Way', 'LocalSwaggerMock')
                        ctx.set('Api-True-Url', `./mock/swagger/${localMockPath}`)
                        break
                    }
                }
                if (response) {
                    return ctx;
                }
            }
            return null;
        }
        // proxy
        const proxyFn = async() => {
            const {
                path: proxyPath,
                proxyConfigOne
            } = UtilsProxy.getProxyConfigOne(url, this.proxyConfigs)
            if (proxyConfigOne) {
                // 检测target末位是否为/ 和 proxyPath的首位为/
                let apiPrefix = proxyConfigOne.target || '';
                let apiPath = proxyPath || '';
                if (apiPrefix && apiPath) {
                    const apiPrefixLast = apiPrefix.substr(apiPrefix.length - 1, 1)
                    const apiPathFirst = apiPath.substr(0, 1)
                    if (apiPrefixLast === '/' && apiPathFirst === '/') {
                        apiPath = apiPath.substr(1, apiPath.length - 1)
                    }
                }
                const ajaxUrl = apiPrefix + apiPath;
                const { body: ctxBody, query: ctxQuery } = ctx.request;
                const ajaxConfig = {
                    method,
                    url: ajaxUrl,
                };
                // console.log('ajaxUrl', apiPrefix, apiPath, ajaxUrl, ctxQuery)
                if (header['cookie']) {
                    ajaxConfig.headers = {
                        Cookie: header['cookie']
                    }
                }
                if (method === 'GET' && ctxQuery) {
                    ajaxConfig.params = ctxQuery;
                } else if (ctxBody) {
                    ajaxConfig.data = ctxBody;
                }
                try {
                    const serveRes = await UtilsAxios(ajaxConfig)
                    if (serveRes && serveRes.hasOwnProperty('data') && serveRes.data) {
                        logger.info('Good!匹配到代理Server:', ajaxUrl)
                        const serveResData = serveRes.data || {};
                        // 自定义Code逻辑
                        if (urlParams && urlParams.hasOwnProperty('code') && Utils.isNumber(urlParams.code)) { // url是否传入code=xxx
                            serveResData.code = parseInt(urlParams.code)
                        } else if (globalCode || globalCode === 0) { // 启动参数是否配置全局code
                            serveResData.code = parseInt(globalCode)
                        }
                        ctx.body = serveResData;
                        ctx.set('Api-Get-Way', 'ProxyServer')
                        const urlArr = url.split('?');
                        ctx.set('Api-True-Url', `${ajaxUrl}${urlArr.length > 1 ? '?' + urlArr[1] : ''}`)
                        return ctx;
                    }
                } catch (error) {
                    logger.warn('Error!代理Server:', ajaxUrl, error)
                }
            }
            return null
        }

        // 模式分流
        if (mode === MODE_LOCAL) { // local：优先LocalMock，其次SwaggerLocalMock，最后Proxy代理；
            let res = await localMockFn() // 读取LocalMock
            if (!res) {
                res = await swaggerMockFn() // 读取LocalSwaggerMock
                if (!res) {
                    res = await proxyFn() // 检测是否配置proxy 读取代理Server
                }
            }
        } else if (mode === MODE_SWAGGER) { // swagger：优先SwaggerLocalMock，其次LocalMock，最后Proxy代理；
            let res = await swaggerMockFn() // 读取LocalSwaggerMock
            if (!res) {
                res = await localMockFn() // 读取LocalMock
                if (!res) {
                    res = await proxyFn() // 检测是否配置proxy 读取代理Server
                }
            }
        } else if (mode === MODE_LOCAL_ONLY) { // localOnly：仅LocalMock
            await localMockFn()
        } else if (mode === MODE_SWAGGER_ONLY) { // swaggerOnly：仅SwaggerLocalMock模式
            await swaggerMockFn()
        } else if (mode === MODE_PROXY_ONLY) { // proxyOnly：仅Proxy代理模式
            await proxyFn()
        }

        // 最终都匹配不上时next 404
        next && next()
    },
}

export default App
