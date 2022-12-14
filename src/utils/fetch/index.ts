import Axios from "axios";
import qs from "qs";
import { merge } from "lodash";
import { handleError, reportError } from "./dealError";
import { cancelRequest } from "./cancel";
import loading from "../loading/index";
import { baseUrl } from "@/service/index";

// headers post
Axios.defaults.headers.post["Content-Type"] = "application/json";

const AXIOS_CONFIG: any = {
    withCredentials: true,
    timeout: 30000,
    baseURL: baseUrl
};

let defaultOptions = {
    isShowLoading: false, // 是否显示loading, 默认为false
    isHandleError: true, // 是否处理错误消息提示, 默认为true
    isHandleErrorCode: true, // 是否处理错误code码消息提示, 默认为true
    successCode: 0, // 成功code码, 默认为0
    successCodeKey: 'code', // 成功key, 默认为code
    paramsSerializer: params => qs.stringify(params, { indices: false }) // 处理数组请求参数
};

// 自定义配置
let AXIOS_CONFIG_CUSTOM = {};

const fetch: any = Axios.create(AXIOS_CONFIG);
fetch.cancelRequest = cancelRequest();

fetch.interceptors.request.use(
    (config) => {
        const requestOption = {
            ...defaultOptions,
            ...config,
            ...AXIOS_CONFIG_CUSTOM,
        };
        // [cancel]移除请求
        fetch.cancelRequest.remove(requestOption);
        // 开启loading
        if (requestOption.isShowLoading) {
            // 增加loadingConfig参数支持请求配参
            loading.show(requestOption.loadingConfig || {});
        }
        // [cancel]添加请求
        fetch.cancelRequest.add(requestOption);
        return requestOption;
    },
    (error) => {
        handleError(400);
        Promise.reject(error);
    }
);

fetch.interceptors.response.use((response) => {
    const { config = {} as any, headers = {} as any, data: resData = {} as any } = response;

    // http错误
    if (response.status < 200 || response.status >= 300) {
        if (config && config.isHandleError) {
            handleError(response.status);
        }
        // 增加接口错误上报 update by boomer 2021-11-18 11:06:11
        reportError({
            config,
            response,
            project: import.meta.env.VITE_APP_PERFORMANCE_PID,
        });

        return Promise.reject(resData);
    }
    // 服务逻辑错误 and 非content-type: "text/plain; charset=utf-8" | text/html请求
    if (resData[config.successCodeKey] !== config.successCode && headers['content-type'] && headers['content-type'].indexOf('text/plain') < 0 && headers['content-type'].indexOf('text/html') < 0) {
        if (config && config.isHandleError && config.isHandleErrorCode) {
            // 如果有对应的错误号,交给handleError做公共处理
            handleError(resData[config.successCodeKey], resData.message);
        }
        // 增加接口错误上报 update by boomer 2021-11-18 11:06:11
        reportError({
            config,
            response,
            project: import.meta.env.VITE_APP_PERFORMANCE_PID,
        });

        return Promise.reject(resData);
    }
    if (config && config.isShowLoading) {
        loading.hide();
    }
    return Promise.resolve(resData);
}, (error) => {
    const { config = {} as any, response = {} as any, message } = error;
    // 处理错误
    if (config && config.isHandleError) {
        if (response) {
            handleError(response.status);
        } else if (error && (error + '').indexOf('Network Error') > -1) {
            handleError(error)
        }
    }
    // 增加cancelRequest不进入reportError
    if (!(message && typeof(message) == 'string' && message.indexOf('cancelRequest&') > -1)) {
        // 增加接口错误上报 update by boomer 2021-11-18 11:06:11
        reportError({
            config,
            response,
            project: import.meta.env.VITE_APP_PERFORMANCE_PID,
        });
    }

    if (config && config.isShowLoading) {
        loading.hide();
    }
    return Promise.reject(error);
});

// 更新配置
export const setConfig = (config) => {
    AXIOS_CONFIG_CUSTOM = config
}
// 更新defaultOptions
export const setFetch = (config) => {
    defaultOptions = merge(defaultOptions, config)
}

export default fetch;
