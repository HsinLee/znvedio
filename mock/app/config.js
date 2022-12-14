// App name
export const APP_NAME = 'CarsMock'

// 处理后的mock数据的存放文件夹
export const MOCK_DIR = '.mock'
export const MOCK_JSON_DIR = 'mock'
// mock host
export const MOCK_HOST = 'carsmock.guazi-cloud.com'

// 根据swagger生成的mock数据存放文件夹
export const SWAGGER_DIR = 'swagger'

// 存储在etcd key
export const ETCD_KEY = 'mock' // mockDev

// mode类型
export const MODE_LOCAL = 'local'
export const MODE_SWAGGER = 'swagger'
export const MODE_LOCAL_ONLY = 'localOnly'
export const MODE_SWAGGER_ONLY = 'swaggerOnly'
export const MODE_PROXY_ONLY = 'proxyOnly'

export const APP_CONFIG = {
    // port: 9000,
    dir: './mock',
    sleep: 0,
    mode: 'local' // 默认配置为支持在线
}
