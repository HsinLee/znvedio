import { createRequire } from 'module'; 
const require = createRequire(import.meta.url);
/**
 * 代理实现
 */
const nodePath = require('path');

export default {
  /**
   * 处理代理
   */
  handleProxyConfig() {
    // Mock代理
    let configPaths = ['./mock/config.js', './vue.config.js', './build.js'];
    // 优先读取mock/config.js、其次读取vue.config.js、再次读取金融build.js
    const mockProxyFn = () => {
      const newConfigPath = configPaths.shift();
      try {
        if (newConfigPath) {
          const configPath = nodePath.join(process.cwd(), newConfigPath);
          const mockConfig = require(configPath);
          if (mockConfig && mockConfig.hasOwnProperty('devServer') && mockConfig.devServer && mockConfig.devServer.hasOwnProperty('proxy') && mockConfig.devServer.proxy && Object.keys(mockConfig.devServer.proxy).length) {
            // 如果匹配上的化，强制性滞空避免递归
            configPaths = [];
            return mockConfig.devServer.proxy;
          } else {
            return mockProxyFn();
          }
        }
      } catch (error) {
        console.log('Require MockConfig Not Found：', newConfigPath);
        return mockProxyFn();
      }
    }
    return mockProxyFn();
  },
  /**
   * 处理path
   * @param {*} url
   * @returns
   */
  getProxyConfigOne(url, proxyConfigs) {
    let path = decodeURI(url.split('?')[0]); // 反编码path
    // let path = decodeURI(url);
    let proxyConfigOne = null
    // 去除代理中的pathRewrite：将path匹配proxy将pathRewrite处理下
    if (proxyConfigs && Object.keys(proxyConfigs).length) {
      for (let key in proxyConfigs) {
        if (path.indexOf(key) > -1 && key) {
          proxyConfigOne = proxyConfigs[key] || {};
          if (proxyConfigOne.pathRewrite) {
            for (let pathRewriteKey in proxyConfigOne.pathRewrite) {
              const regExp = new RegExp(pathRewriteKey)
              path = path.replace(regExp, proxyConfigOne.pathRewrite[pathRewriteKey]);
            }
          }
          break;
        }
      }
    }
    return {
      path,
      proxyConfigOne,
    };
  },
}
