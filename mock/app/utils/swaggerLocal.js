import { createRequire } from 'module'; 
const require = createRequire(import.meta.url);
import Swagger2Mock from '../lib/SwaggerMock.js'
const { join } = require('path');
// const fsExtra = require('fs-extra')
const fs = require('fs')
// const { SWAGGER_DIR } = require('../config')

export default {
  /**
   * 执行基于swaggerUrl
   */
  async init(option, swaggerConfigs) {
    if (!(swaggerConfigs && swaggerConfigs.length)) {
      return
    }
    // 实例化
    const swaggerLocalMock = new Swagger2Mock({ urls: swaggerConfigs, mockOptions: option })
    // 初始化
    await swaggerLocalMock.init()

    // 处理本地忽略文件
    this.handleGitignore()

    return swaggerLocalMock
  },
  handleGitignore() {
    // 查找本地.gitignore
    const gitignorePath = join(process.cwd(), '.gitignore')

    fs.readFile(gitignorePath, "utf-8", function (error, data) {
      if (error) {
        console.error(".gitignore", error)
        return;
      }
      if (!data || (data && data.indexOf('.mock') < 0)) {
        data = `${data}
.mock`;
        fs.writeFile(gitignorePath, data, 'utf8', (err) => {
          if (err) {
            console.log("写入文件gitignore失败", err)
            return err;
          }
          // console.log('写入.gitignore done');
        });
      }
    });
  },
  /**
   * 获取SwaggerConfigs
   */
  handleSwaggerConfigs() {
    try {
      const configPath = join(process.cwd(), 'mock/config.js');
      const mockConfig = require(configPath);
      if (mockConfig && mockConfig.hasOwnProperty('swagger') && mockConfig.swagger) {
        return mockConfig.swagger;
      }
    } catch (error) {
      console.log('Require SwaggerConfigs Not Found in mock/config.js');
    }
  },
}