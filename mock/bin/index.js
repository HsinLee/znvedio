#!/usr/bin/env node
import { createRequire } from 'module'; 
const require = createRequire(import.meta.url);

var program = require('commander');
const Koa = require('koa');
const log4js = require('koa-log4');
const koaBody = require('koa-body');
const portfinder = require('portfinder');
const bodyParser = require('koa-bodyparser');
import logger from '../app/lib/logger.js';
import MockApp from '../app/index.js'
import { MOCK_HOST } from '../app/config.js'
import Utils from '../app/utils/index.js'
const https = require('https');
const fs = require('fs');
const { join } = require('path');
const sslify = require('koa-sslify').default



program
    .option('-d, --dir <dir>', 'mock路径:默认./mock')
    .option('--mode <mode>', '启动模式:默认local')
    // mode模式取值
    // local：优先LocalMock，其次SwaggerLocalMock，最后Proxy代理；
    // swagger：优先SwaggerLocalMock，其次LocalMock，最后Proxy代理；
    // localOnly：仅LocalMock
    // swaggerOnly：仅SwaggerLocalMock模式
    // proxyOnly：仅Proxy代理模式
    .option('--https <https>', '启动模式:默认http') // https：true为开启
    .option('--base-url <base-url>', '根路径')
    .option('--port <port>', '指定启动端口号')
    .option('--sleep <sleep>', '接口数据返回延时毫秒数')
    .option('--code <code>', '接口数据返回code值')
    .option('--gitignore <gitignore>', '是否生成当前启动信息git忽略文件:默认true')
    .parse(process.argv);
    // .outputHelp(); // !process.argv.slice(2).length process.argv.length > 1


const app = new Koa();
app.use(log4js.koaLogger(log4js.getLogger("http"), { level: 'auto' }))
.use(koaBody())
.use(bodyParser())
.use((ctx, next) => {
    return MockApp.getMiddleware(ctx, next)
})

// 初始化init
const initApp = (port) => {
    // MockApp初始化
    MockApp.init(program, port)

    // 检测是否https访问
    const httpsVal = Utils.getKeyValFromProgram(program, 'https')
    if (httpsVal && httpsVal === 'https' || httpsVal === 'true') { // 开启https服务
        app.use(sslify())
        const options = {
            key: fs.readFileSync(join(__dirname, './cert/cert.key')),
            cert: fs.readFileSync(join(__dirname, './cert/cert.crt'))
        };
        https.createServer(options, app.callback()).listen(port, () => {
            console.info(`Cars-Mock Server is running in https://${MOCK_HOST}:${port}`)
        });
    } else { // 默认http启动
        app.listen(port, '0.0.0.0', () => {
            console.info(`Cars-Mock Server is running in http://${MOCK_HOST}:${port}`)
        });

    }
}

// 查看是否在启动时配置固定的端口号
const portVal = Utils.getKeyValFromProgram(program, 'port')
if (portVal) { // 启动时配置固定端口号
    initApp(portVal)
} else { // 系统自动分配端口号
    portfinder.getPort({
        port: 9000,    // minimum port
        stopPort: 9999 // maximum port
    }, (err, port) => {
        if (err) {
            console.error('getPortError', err)
        } else {
            initApp(port)
        }
    })
}

// on错误
app.on('error', err => {
    if (!(err && err.code === 'EADDRINUSE')) {
        console.error(err)
    }
});