import { createRequire } from 'module'; 
const require = createRequire(import.meta.url);
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const isPlainObject = require('lodash/isPlainObject');
const { pathToRegexp } = require("path-to-regexp");
import logger from './logger.js'

let READER_OPTIONS = {
    prefix: '',
    getData(data){
        return data
    }
};
let DATA = {};
let ROUTER_PATH = {};
let specialRouterExps = {}; // 特殊路由（apiName）暂存对象
let BASE_DIR = '';
let IS_INIT = false;
let urlQueryArr = [];
let dataString = '';
const isRootURL = /^\//;

class DataReader {
    async init(baseDir){
        IS_INIT = true;

        await this.setBaseDir(baseDir)
        await this.readDir(undefined, true);
        await this.watch();

        // logger.info('data reader is inited, Router list is: ', Object.keys(DATA))
    }
    async setBaseDir(baseDir){
        const isRelative = /^\.\//

        BASE_DIR = isRelative.test(baseDir) ? path.join(process.cwd(), baseDir) : baseDir
    }
    async setConfig(option){
        READER_OPTIONS = option;
    }
    async watch(){
        fs.watch(BASE_DIR, {recursive: true}, async ({filename}) => {
            this.reset();
            await this.readDir();
            // logger.info(`file ${filename} changed, reload data, new data is: `, JSON.stringify(DATA).replace(/\s/g, ''))
            if (filename) {
                logger.info(`MockFile ${filename} changed`)
            }
        })
    }
    updateDataString(){
        dataString = JSON.stringify(DATA);
    }
    /**
     * 原main.js里的checkPathInData
     * @param {*} path
     */
    checkPathInData(path){
        const reg1 = new RegExp('\"' +path, "g"); //数据里面是否有路径key
        if (reg1.test(dataString)) {
            //检测出所有url 后面query部分 如 ["a=1","b=2","a=1&b=2"]
            const reg2 = new RegExp('(?<="' + path + '\\?)' + '' + '.*?(?=")', "g");
            urlQueryArr = dataString.match(reg2) || [];
            //     return true
            // } else {
            //     return false
        }
        return true
    }
    /**
     * 原main.js里的getQueryData
     * @param {*} query
     */
    getQueryData(query){
        for (let queryKey in query) {
            let _q = queryKey + '=' + query[queryKey]
            if (urlQueryArr.indexOf(_q) !== -1) {
                return '?' + _q
            }
        }
        return ''
    }
    isInit(){
        return IS_INIT
    }
    reset(){
        DATA = {};
        ROUTER_PATH = {};
        specialRouterExps = {};
    }
    async readDir(dir = BASE_DIR, isRoot){
        const readdir = promisify(fs.readdir);
        const stat = promisify(fs.stat);
        const files = await readdir(dir);
        const promises = files.map(async file => {
            const isHiddenFile = /^\./;

            // 以点开头的系统文件直接跳过
            if(file.match(isHiddenFile)) return;

            const fullPath = path.join(dir, file);
            const optionPath = path.join(dir, 'index.js');
            let option;

            try{
                option = require(optionPath);
            }catch(error){
                // logger.warn(`load dir ${dir} with no option`)
                option = {};
            }

            if(isRoot) await this.setConfig(option);

            if (file === 'index.js' || file === 'config.js' || file === 'server.js' || file === 'server.common.js') return;

            // 不符合规则的文件直接跳过
            const {filter} = this.getCurrentOption(option);
            if(filter && !file.match(filter)) return;

            const fileState = await stat(fullPath);

            if(fileState.isDirectory()){
                await this.readDir(fullPath)
            }else{
                await this.loadFile(fullPath, option)
            }
        })

        await Promise.all(promises)
        this.updateDataString()
    }
    async loadFile(filePath, option){
        const {prefix, getData} = this.getCurrentOption(option);
        const readFile = promisify(fs.readFile);
        let fileData = await readFile(filePath, 'utf8');

        try {
            fileData = JSON.parse(fileData);
        } catch (error) {
            logger.error(`load file ${filePath} error: `, error.toString())
            fileData = {}
        }

        const keys = isPlainObject(fileData) ? Object.keys(fileData) : [];

        keys.forEach( key => {
            const data = DATA;
            const routerPath = ROUTER_PATH;
            const router = path.join(prefix, key.replace(/--/g, '/').replace(/\?$/, '')); //兼容json-server的--分隔路径和GET请求路径带?的情况
            const resData = fileData[key];

            // if((router in routerPath) && routerPath[router] !== filePath){
            //     logger.error(`router ${router} in ${filePath} has been defined in ${routerPath[router]}`)
            // }

            data[router] = getData ? getData(resData) : resData;

            // 暂存router数据
            if (router) {
                if (router.indexOf(':') > -1) {
                    specialRouterExps[router] = pathToRegexp(router)
                } else if (router.indexOf('{') > -1 && router.indexOf('}') > -1) { // 兼容式支持Swagger{xxx}写法
                    let routerSpecial = router.replace(new RegExp('{', 'g'), ':')
                    routerSpecial = routerSpecial.replace(new RegExp('}', 'g'), '')
                    specialRouterExps[router] = pathToRegexp(routerSpecial)
                }
            }

            routerPath[router] = filePath;
        })
    }
    getCurrentOption(option = {}){
        // logger.info('data reader option: ', option)
        const {prefix: configPrefix = ''} = READER_OPTIONS;
        const {prefix: currentPrefix = ''} = option;

        let prefix = isRootURL.test(currentPrefix) ? currentPrefix : path.join(configPrefix, currentPrefix);

        // 传入的path不含根目录
        prefix = prefix.replace(/^\//, '');

        return Object.assign({}, READER_OPTIONS, option, {prefix})
    }
    getDataByRouter(api){
        // DATA: { a: { a: 1, id: '@id', 'list|20': [ [Object] ] }, b: { b: 1 }, 'api/{id}': { cc: 'xxx' } }
        // api: api/ass

        // 优先正常key val匹配
        if (api && DATA[api]) {
            return DATA[api]
        }

        // 匹配不上的进入特殊
        let PiPeiZhi = '';
        for (let specialRouter in specialRouterExps) {
            const specialRouterExp = specialRouterExps[specialRouter]
            if (specialRouterExp.test(api)){
                PiPeiZhi = DATA[specialRouter]
                break;
            }
        }

        // // 将api拆解为/ []数组
        // const apiArr = api.split('/');
        // // for遍历 DATA
        // for (let key in DATA) {
        //     if (key.indexOf('{') > -1 && key.indexOf('}') > -1) {
        //         // 先判断是否 含/一样的
        //         const keyArr = key.split('/');
        //         if (keyArr.length === apiArr.length) {
        //             // 再判断 每一位是否相同（如果含{}那么就将 api的哪一项给他匹配）
        //             let pipeiSum = 0;
        //             for (let i = 0; i < keyArr.length; i++) {
        //                 if (!(keyArr[i].indexOf('{') > -1 && keyArr[i].indexOf('}') > -1)) {
        //                     if (keyArr[i] === apiArr[i]) {
        //                         pipeiSum += 1;
        //                     } else {
        //                         continue;
        //                     }
        //                 } else {
        //                     pipeiSum += 1;
        //                 }
        //             }
        //             if (pipeiSum === apiArr.length) {
        //                 PiPeiZhi = DATA[key];
        //                 break;
        //             }
        //         }
        //     }
        // }
        return PiPeiZhi;
    }
}

export default DataReader;