import { ElMessage } from "element-plus";
import loading from "../loading/index";

const STATUS_HANDLER = {
    400: () => "请求错误(400)",
    404: () => "请求出错(404)",
    408: () => "请求超时(408)",
    500: () => "服务器错误(500)",
    502: () => "网络错误(502)",
    503: () => "服务不可用(503)",
    504: () => "网络超时(504)",
    505: () => "HTTP版本不受支持(505)",
};

export const handleError = (status, msg) => {
    const statusToString = status && status.toString();
    const message = statusToString && STATUS_HANDLER[statusToString]
        ? STATUS_HANDLER[statusToString]()
        : `请求错误${(status || status === 0) ? '(' + status + ')' : ''}`;
    // close loading
    loading && loading.hide();
    // message
    ElMessage({
        message: msg && typeof (msg) === 'string' ? msg : message,
        type: 'error',
        showClose: true,
    });
    return `${message}，请检查网络或联系管理员！`;
};

/**
 * 错误上报封装
 * 迁移自孙辉http://git.guazi-corp.com/xinche/xinche-common-lib/tree/0.0.6
 * @config {*} config
 * @config {*} response
 */
export function reportError(opts = {}) {
    // if (!report) {
    //   throw new Error("report is null");
    // }
    // if (typeof report !== "function") {
    //   throw new Error("report is not a function");
    // }

    const { config = {}, response = {}, project } = opts;
    if (!project) {
        return;
    }

    // eslint-disable-line
    const { url, method, baseURL } = config;
    const { status: httpCode, data, level = "error", reportLevel = "error" } = response;

    // fix: 修正api上报时缺少baseURL update by boomer 2021-12-08 12:07:34
    // fix: 修正api上报时走了反向代理此时基于location.origin组装 update by boomer 2021-12-08 18:36:08
    let apiUrl = url;
    if (url && url.indexOf('http') < 0) {
        if (baseURL && baseURL.indexOf('http') > -1) {
            apiUrl = baseURL + url;
        } else if (window && window.location) {
            apiUrl = window.location.origin + url;
        }
    }

    /**
     * errorCode规则：
     * 1、"error01": code没返回字段
     * 2、"error02": code返回了为空
     * update by boomer 2021-12-22 15:50:15
     */
    let errorCode = '';
    if (data && typeof (data) === 'object' && data.hasOwnProperty('code')) {
        if (data.code || data.code === 0) {
            errorCode = data.code;
        } else {
            errorCode = "error02";
        }
    } else {
        errorCode = "error01";
    }

    if (apiUrl) {
        report.call(null, {
            page: window.location.href, // fix: api上报增加对应错误发生页面pageurl update by boomer 2022-03-28 13:42:00
            apiUrl,
            method,
            httpCode, // http状态码
            code: errorCode, // 服务端返回的code状态码
            level, // 当前report等级 info', 'warning', 'error'
            reportLevel // 上报的最低等级 info' < 'warning' < 'error'
        });
    }
}
