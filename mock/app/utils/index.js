
// 数组diff
Array.prototype.diff = function (a) {
  return this.filter(function (i) { return a.indexOf(i) < 0; });
}

// 下划线转换驼峰
function toHump(name) {
  return name.replace(/\_(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
}
// 驼峰转换下划线
function toLine(name) {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

// 验证是否为数字
function isNumber(val) {
  return parseFloat(val).toString() !== "NaN"
}

// 睡眠
const doSleep = async time => {
  return new Promise(function (resolve, reject) {
    if (time) {
      setTimeout(function () {
        resolve();
      }, time);
    } else {
      resolve();
    }
  });
}

/**
 * 基于urls数组生成hash
 */
const getHashFromUrls = (arr) => {
  const mockUrlHash = {};
  if (arr && arr.length && Array.isArray(arr)) {
    arr.forEach(item => {
      if (typeof (item) === 'object' && item.hasOwnProperty('url')) {
        mockUrlHash[item.url] = item
      } else if (typeof (item) === 'string') {
        mockUrlHash[item] = {
          url: item,
          code: 0,
          version: 0
        }
      }
    });
  }
  return mockUrlHash;
}

/**
 * url相关处理- urlParse参数解析
 */
const urlParse = (url) => {
  const urlObj = {}
  if (!url) {
    return urlObj
  }
  const urlTemp = url.indexOf('?') !== 0 ? `?${url}` : url
  const urlTempArr = urlTemp.match(/[?&][^?&]+=[^?&]+/g) // ['?id=12345','&a=b']
  if (urlTempArr && urlTempArr.length && Array.isArray(urlTempArr)) {
    urlTempArr.forEach((item) => {
      const tempArr = item.substr(1).split('=')
      urlObj[decodeURIComponent(tempArr[0])] = decodeURIComponent(tempArr[1])
    })
  }
  return urlObj
}


/**
 * 合并option
 * @param {*} option
 * @returns
 */
const mergeConfig = (option, APP_CONFIG) => {
  const finalOption = Object.assign({}, APP_CONFIG)

  Object.entries(option).forEach(([key, value]) => {
    if (value) {
      if (key === 'sleep') { // 确保sleep为Number类型
        value = isNaN(+ value) ? 0 : value
      }

      finalOption[key] = value
    }
  })

  return finalOption

};

/**
 * 从program中获取参数值
 */
const getKeyValFromProgram = (program, getKey) => {
  const programArr = Object.entries(program)
  let keyVal = ''

  if (programArr && programArr.length) {
    programArr.forEach(([key, value]) => {
      if (value && getKey === key) {
        keyVal = value
      }
    })
  }
  // console.log('keyVal', keyVal)
  return keyVal
}


/**
 * 处理url
 * @param {*} url
 * @param {*} baseUrl
 * @returns
 */
const handleRequestUrl = (url, baseUrl) => {
  // 反编码path
  let path = decodeURI(url.split('?')[0]);

  // 去除根路径
  if (baseUrl) {
    path = path.replace(baseUrl, '')
  }
  // 去除首个/ 避免用户写的不正规导致匹配不上
  path = path.replace(/\//, '');

  return path
}



export default{
  toHump,
  toLine,
  isNumber,
  doSleep,
  getHashFromUrls,
  urlParse,
  mergeConfig,
  getKeyValFromProgram,
  handleRequestUrl,
}