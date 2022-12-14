import { createRequire } from 'module'; 
const require = createRequire(import.meta.url);
// const swaggerParserMock = require('swagger-parser-mock');
import swaggerParserMock from './swaggerParserMock/index.js'
const fsExtra = require('fs-extra')
const { join } = require('path');
import { MOCK_DIR, SWAGGER_DIR } from '../config.js'
import logger from './logger.js';
const { pathToRegexp } = require("path-to-regexp");

// 生成数据简单的原因https://github.com/easy-mock/swagger-parser-mock/blob/e3606cd553/lib/primitives.js
class SwaggerMock {
    constructor({
        urls,
        mockOptions,
    }) {
        this.urls = urls || []
        this.mockOptions = mockOptions || {}
        this.currentUrlItem = {} // 当前url对应item

        this.specialPathExps = {} // 特殊urls 主要存储含有 /:id这种要生成为{id}的特殊url

        // outputPath
        this.outputPath = join(process.cwd(), MOCK_DIR, SWAGGER_DIR) // '.mock/swagger'

        this.hostInfo = {} // 当前正在解析的swagger的host基本信息
    }

    /**
     * 初始化请求
     */
    async init(){
        try {
            await this.ensureOutputDir() // 检测是否存在输出目录
            await this.parseSwagger() // 批量解析urls请求swagger
            await this.outputBaseInfo() // 输出基本信息
        } catch (error) {
            console.error('init error---->', error)
        }
    }

    /**
     * 检测是否存在输出目录
     */
    async ensureOutputDir() {
        const { outputPath } = this

        await fsExtra.ensureDir(outputPath)
    }

    /**
     * 处理url 对象 or 字符串
     */
    handleUrl(data){
        let returnUrl;
        if (typeof (data) === 'object') {
            this.currentUrlItem = {
                ...data
            }
            if (!this.currentUrlItem.hasOwnProperty('code')) {
                this.currentUrlItem.code = 0
            }
            // 返回Url
            if (data.hasOwnProperty('url')) {
                returnUrl = data.url
            }
        } else {
            // 当前url为string时 对应currentUrlItem赋值
            this.currentUrlItem = {}

            returnUrl = data
        }
        return returnUrl
    }

    /**
     * 批量解析urls请求swagger
     */
    async parseSwagger() {
        // 改为for写法 调用await
        for (let i = 0; i < this.urls.length; i++) {
            try {
                await this.processParseSwagger(this.handleUrl(this.urls[i]))
            } catch (error) {
                console.error('parseSwagger error---->', error)
                continue
            }
        }
    }

    /**
     * 解析url请求swagger
     * @param {*} url
     */
    async processParseSwagger(url){
        // 请求SwaggerJson fullPath const fullPath = url + '/v2/api-docs'
        const info = await swaggerParserMock(url + '?t=' + new Date().getTime())

        await this.hanldeMockProjectName(info)
        await this.updateAndOutputHostInfo(info, url)
        await this.traverse(info.paths)
    }

    /**
     * 添加 url 到 Swagger中
     * @param {*} urlItem
     */
    async addSwagger(urlItem){
        let url = this.handleUrl(urlItem)

        const hasProtocol = /https?:\/\//.test(url)

        if(!hasProtocol) url = 'http://' + url

        await this.processParseSwagger(url)

        // 弱检测
        if (!this.urls.includes(urlItem)) {
            this.urls.push(urlItem)
        }

        this.outputBaseInfo()
    }

    /**
     * 输出基本信息
     */
    async outputBaseInfo(){
        const {urls} = this
        const baseInfo = {
            swagger: "2.0",
            urls,
            updateAt: + new Date()
        }

        await this.outputJSON('index', baseInfo, true)
    }

    /**
     * 获取当前项目名称
     */
    hanldeMockProjectName(info) {
        // openapi: "3.0.0" 多为Go项目不存在host信息，那么伪造成openapi
        if (!info.host) {
            info.host = 'openapi.guazi-cloud.com'
        }
        if (!this.currentUrlItem.project) {
            const hostMatchArr = info.host.match(/^([\w\d\-\_]+)\./) || [];
            this.currentUrlItem.project = hostMatchArr[1] || ''
        }
        return Promise.resolve(this.currentUrlItem.project || '')
    }

    /**
     * 是否额外组装/api到path
     * @param {*} paths
     */
    handleMockPath(path) {
        let prefixStr = '';
        // 是否主动传入了project名称
        if (this.currentUrlItem.project) {
            prefixStr = `${this.currentUrlItem.project}`
        }
        // 检测是否传入alias
        if (this.currentUrlItem.alias) {
            prefixStr = `${prefixStr}${this.currentUrlItem.alias}`
        }

        if (prefixStr) {
            path = `${prefixStr}${path}`
        }
        return path
    }

    /**
     * 输出当前host下的基本信息
     * @return  {[type]}  [return description]
     */
    async updateAndOutputHostInfo({
        paths, host, info, basePath
    }, url){
        const {version, title, description} = info || {}

        const hostInfo = {
            host, version, title, description, basePath,
            // alias,
            paths: Object.keys(paths).map(path => {
                const prefix = `http://carsmock.guazi-cloud.com:${this.mockOptions.port}/`;
                return `${prefix}${this.handleMockPath(path)}` // 是否额外组装/api到path
            }), // 二次加工paths paths: Object.keys(paths),
            updateAt: + new Date()
        }

        this.hostInfo = hostInfo
        // this.hostCache.set(alias || host, hostInfo)

        // 将当前项目的Swagger写入到${mainJsonName}.json方便查找 update by boomer 2021-03-08 14:48:38
        // java多为${project}/index.json
        // go多为${project}/lego_web.json
        let mainJsonName = 'index'
        if (url && url.indexOf('.json') > -1) {
            // 多为Go项目 检测url 是否是一个.json文件，是的话截取json-Name用于host, 例如openapi-3.0  http://gateway-internal.guazi-cloud.com/tools/openapi3-json/proto/finance/service/lego/lego_web.json update by boomer 2021-02-22 14:16:06
            // 临时方案：使用jsonName做补位
            const urlSplitArr = url.split('/')
            const jsonFileName = urlSplitArr[urlSplitArr.length - 1];
            const jsonName = jsonFileName.split('.json')[0];
            if (jsonName) {
                mainJsonName = jsonName;
            }
        }
        await this.outputJSON(`${this.currentUrlItem.project}/${mainJsonName}`, hostInfo)
    }

    /**
     * 基于paths生成对应目录和json文件
     * @param {*} paths
     */
    async traverse(paths) {
        // 从代码严谨性考虑：在写入文件时也改为for await写法
        const pathsArr = Object.entries(paths)
        for(let i = 0; i < pathsArr.length; i++) {
            let [path, data] = pathsArr[i];

            // 是否额外组装/api到path
            path = this.handleMockPath(path);

            for (let method in data) {
                const pathInfo = data[method];
                const responseData = pathInfo['responses']['200']
                if (!responseData) {
                    continue;
                }
                await this.generate(path, responseData.example)
            }
        }
    }

    /**
     * 基于path和数据生成json文件
     * @param {*} path
     * @param {*} dataString
     */
    async generate(path, dataString) {
        if (!path) return
        if (!dataString) return
        const data = this.parseData(dataString)

        if (typeof data === 'string') return
        await this.outputJSON(path, data);
    }

    /**
     * 转义数据
     * @param {*} jsonString
     * @returns
     */
    parseData(jsonString) {
        let data = ''
        try {
            data = JSON.parse(jsonString)
        } catch (error) {
            logger.error('parse error with JSON string', data, error);
        }

        return data
    }

    /**
     * 输出JSON
     * @param {*} name
     * @param {*} data
     * @param {*} isRoot isRoot = false
     */
    async outputJSON(name, data){
        const { outputPath } = this

        const pathArr = [outputPath]
        pathArr.push(`${name}.json`) //  [ '/Users/wangwenjie/Documents/cars-mock/.mock/swagger', 'eipis-user/user/claim/material/{material_type}/info.json' ]

        const filePath = join(...pathArr) // '/Users/wangwenjie/Documents/cars-mock/.mock/swagger/eipis-user/user/claim/material/{material_type}/info.json'

        // 检测filePath中是否含有{xxx}, 存在则将其转换为:xxx，同时基于pathToRegexp生成正则匹配表达式
        // 备注：pathToRegexp https://www.npmjs.com/package/path-to-regexp Turn a path string such as /user/:name into a regular expression.
        if (filePath && filePath.indexOf('{') > -1 && filePath.indexOf('}') > -1) {
            let filePathSpecial = filePath.replace(new RegExp('{', 'g'), ':')
            filePathSpecial = filePathSpecial.replace(new RegExp('}', 'g'), '')// filePathSpecial: /Users/wangwenjie/Documents/cars-mock/.mock/swagger/eipis-user/user/claim/material/:material_type/info.json

            // 暂存specialPathExps方便后面匹配比对
            /**
             * specialPathExps:{
             *    ${filePath}: 基于pathToRegexp(${filePathSpecial})后的正则表达式
             * }
             */
            this.specialPathExps[filePath] = pathToRegexp(filePathSpecial)
        }
        try {
            // 二次加工data
            if (typeof (data) === "object" && data) {
                // code
                if (data.hasOwnProperty('code')) {
                    data.code = this.currentUrlItem.code || 0;
                }
                // pagination
                if (data.data && data.data.hasOwnProperty('pagination')) {
                    // list | items
                    ['list', 'items'].forEach(key => {
                        if (data.data && data.data.hasOwnProperty(key) && Array.isArray(data.data[key])) {
                            data.data[`${key}|20`] = JSON.parse(JSON.stringify(data.data[key]));
                            delete data.data[key]
                        }
                    })
                    data.data['pagination'] = {
                        currentPage: 1,
                        pageSize: 20,
                        total: 15 * 20 // 15页
                    }
                }
            }
            await fsExtra.outputJSON(filePath, data, {
                spaces: 4
            })
            // logger.info('outputJSON', filePath)
        } catch (error) {
            logger.error('generate mock data error', error);
        }
    }

    /**
     * 获取json数据
     * @param {*} path
     * @returns
     */
    async getData(path) {
        const filePath = join(this.outputPath, `${path}.json`)
        // path: eipis-user/calculator/product/result/v2/xxx
        // filePath: /Users/wangwenjie/Documents/cars-mock/.mock/swagger/eipis-user/calculator/product/result/v2/xxx.json
        let data = null
        try {
            // 直接基于filePath请求
            data = await fsExtra.readJSON(filePath)
        } catch (error) {
            // 请求不到的才 通过遍历特殊paths对应的path正则 命中
            for (let specialPath in this.specialPathExps) {
                const specialPathExp = this.specialPathExps[specialPath]
                // console.log('specialPathExp-->', specialPathExp, filePath, specialPathExp.test(filePath))
                if (specialPathExp.test(filePath)) { // 正则匹配上了后，使用暂存的specialPath读取json数据
                    try {
                        data = await fsExtra.readJSON(specialPath)
                    } catch (error) {
                        logger.warn(`getSwaggerData from ${specialPath} Not Found`)
                    }
                    break;
                }
            }
            // 此时判断data有无数据用于展示错误信息
            if (!data) {
                logger.warn(`getSwaggerData from ${path} Not Found`,)
            }
        }
        return data
    }
}

export default SwaggerMock;