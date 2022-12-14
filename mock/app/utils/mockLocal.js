import { createRequire } from 'module'; 
const require = createRequire(import.meta.url);
// const DataReader = require('./lib/reader');
const { join } = require('path');
const fsExtra = require('fs-extra')
const fs = require('fs')
import { MOCK_JSON_DIR, MOCK_HOST } from '../config.js'

export default {
  /**
   * 判断是否业务项目有mock文件夹+ config.js + data.json
   */
  async handleLocalMock({ port, https, gitignore }) {
    try {
      const localMockMuluPath = join(process.cwd(), MOCK_JSON_DIR)
      // 1、检测有无 没有的话创建一个
      await fsExtra.ensureDir(localMockMuluPath)

      // 1-1、判断是否有server.js
      await this.handleMockServer({ port, https, gitignore })
      await this.handleMockServerCommon({ port, https, gitignore })

      // 2、判断是否含有config.js
      await this.handleMockConfig()

      // 3、判断是否含有data.json
      await this.handleMockDataJson()

    } catch (error) {
      console.error('handleLocalMock-Error:', error)
    }
  },
  /**
   * 处理mockServer
   * @param {*} port
   */
  async handleMockServer({ port, https, gitignore }) {
    const localMockServerPath = join(process.cwd(), MOCK_JSON_DIR, 'server.js')
    await fsExtra.ensureFile(localMockServerPath)

    // 读取文件
    fs.readFile(localMockServerPath, "utf-8", function (error) {
      if (error) {
        console.error("localMockServerPath readFile", error)
        return;
      }
      const httpPrefix = (https && (https === 'https' || https === 'true')) ? 'https' : 'http'
      // 写入文件
      fs.writeFile(localMockServerPath, `/* eslint-disable */
export default {
  host: '${MOCK_HOST}',
  port: ${port},
  apiPrefix: '//${MOCK_HOST}:${port}',
  apiHttpPrefix: '${httpPrefix}://${MOCK_HOST}:${port}'
}`, 'utf8', (err) => {
        if (err) {
          console.log("写入文件localMockServerPath失败", err)
          return err;
        }
        // console.log('写入localMockServerPath done');
      });
    });

    // 查找本地.gitignore
    if (gitignore && gitignore !== 'false') {
      const gitignorePath = join(process.cwd(), '.gitignore')

      fs.readFile(gitignorePath, "utf-8", function (error, data) {
        if (error) {
          console.error(".gitignore", error)
          return;
        }
        if (data.indexOf('mock/server.js') < 0) {
          fs.writeFile(gitignorePath, `${data}
mock/server.js`, 'utf8', (err) => {
            if (err) {
              console.log("写入文件gitignore失败", err)
              return err;
            }
            // console.log('写入.gitignore done');
          });
        }
      });
    }
  },
  /**
   * 处理mockServerCommon（生成供Nodejs下使用文件）
   * @param {*} port
   */
  async handleMockServerCommon({ port, https, gitignore }) {
    const localMockServerPath = join(process.cwd(), MOCK_JSON_DIR, 'server.common.js')
    await fsExtra.ensureFile(localMockServerPath)

    // 读取文件
    fs.readFile(localMockServerPath, "utf-8", function (error) {
      if (error) {
        console.error("localMockServerPath readFile", error)
        return;
      }
      const httpPrefix = (https && (https === 'https' || https === 'true')) ? 'https' : 'http'
      // 写入文件
      fs.writeFile(localMockServerPath, `/* eslint-disable */
module.exports = {
  host: '${MOCK_HOST}',
  port: ${port},
  apiPrefix: '//${MOCK_HOST}:${port}',
  apiHttpPrefix: '${httpPrefix}://${MOCK_HOST}:${port}'
}`, 'utf8', (err) => {
        if (err) {
          console.log("写入文件localMockServerPath失败", err)
          return err;
        }
        // console.log('写入localMockServerPath done');
      });
    });

    // 查找本地.gitignore
    if (gitignore && gitignore !== 'false') {
      const gitignorePath = join(process.cwd(), '.gitignore')

      fs.readFile(gitignorePath, "utf-8", function (error, data) {
        if (error) {
          console.error(".gitignore", error)
          return;
        }
        if (data.indexOf('mock/server.common.js') < 0) {
          fs.writeFile(gitignorePath, `${data}
  mock/server.common.js`, 'utf8', (err) => {
            if (err) {
              console.log("写入文件gitignore失败", err)
              return err;
            }
            // console.log('写入.gitignore done');
          });
        }
      });
    }
  },
  /**
   * 处理mock数据config.js
   */
  async handleMockConfig() {
    const localMockConfigPath = join(process.cwd(), MOCK_JSON_DIR, 'config.js')
    await fsExtra.ensureFile(localMockConfigPath)

    // 读取文件
    fs.readFile(localMockConfigPath, "utf-8", function (error, data) {
      if (error) {
        console.error("localMockConfigPath readFile", error)
        return;
      }
      if (!data) {
        data = `/* eslint-disable */
module.exports = {
  swagger: [],
  devServer: {
    proxy: {}
  }
}`;
        // 写入文件
        fs.writeFile(localMockConfigPath, data, 'utf8', (err) => {
          if (err) {
            console.log("写入文件localMockConfigPath失败", err)
            return err;
          }
          // console.log('写入localMockConfigPath done');
        });
      }
    });
  },
  /**
   * 处理mock数据data.json
   */
  async handleMockDataJson() {
    const localMockJsonPath = join(process.cwd(), MOCK_JSON_DIR, 'data.json')
    await fsExtra.ensureFile(localMockJsonPath)

    // 读取文件
    fs.readFile(localMockJsonPath, "utf-8", function (error, data) {
      if (error) {
        console.error("localMockJsonPath readFile", error)
        return;
      }
      if (!data) {
        data = `{
    "/demo/list": {
        "code": 0,
        "message": "成功",
        "data": {
            "list|20": [
                {
                    "id": "@id",
                    "username": "@cname"
                }
            ]
        }
    }
}`;
        // 写入文件
        fs.writeFile(localMockJsonPath, data, 'utf8', (err) => {
          if (err) {
            console.log("写入文件localMockJsonPath失败", err)
            return err;
          }
          // console.log('写入localMockJsonPath done');
        });
      }
    });
  },
  /**
   * 只有第一次初始化dataReader
   * @param {*} dataReader
   * @param {*} dir
   * @returns
   */
  async ensureFileReaderInited(dataReader, dir) {
    if (!dataReader.isInit()) {
      await dataReader.init(dir)
    }
    return true;
  },
  /**
   * 获取数据从文件读取
   * @param {*} ctx
   * @param {*} path
   * @returns
   */
  async getDataFormFileReader(ctx, path, dataReader, dir) {
    // 初始化dataReader
    await this.ensureFileReaderInited(dataReader, dir)

    let { method } = ctx.request;
    let query

    switch (method) {
      case "POST":
        query = ctx.query;
        Object.assign(query, ctx.request.body)
        break;
      case "GET":
        query = ctx.query;
        break;
      default:
        query = ''
    }

    const hasQuery = !!Object.keys(query).length
    let data

    //如果没有query 返回默认值
    if (hasQuery) {
      data = dataReader.getDataByRouter(path, query);
    }
    if (dataReader.checkPathInData(path)) {
      const allPath = path + dataReader.getQueryData(query)
      data = dataReader.getDataByRouter(allPath, query)
    }
    // logger.info('匹配到Mock数据', path)
    return data
  },

}