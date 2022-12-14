import { createRequire } from 'module'; 
const require = createRequire(import.meta.url);
const Axios = require('axios')

// 创建Fetch-简单
const axios = Axios.create({
  timeout: 30000,
  crossDomain: true,
  withCredentials: true, // 全局使用cookie
})

export default axios