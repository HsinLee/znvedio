import Axios from "axios";
import qs from 'qs'

/**
 * 取消axios请求
 * @returns
 */
export const cancelRequest = () => {
    const pending = new Map();
    const getUrl = (config) => {
        let urlArr = [
            'cancelRequest', // 取消请求的独有标识，不可删除
            config.method,
            config.url,
        ];
        // 是否配置添加参数组装为cancelKey
        if (config && config.isCancelRequestUseParams) {
            urlArr = urlArr.concat([
                qs.stringify(config.params),
                qs.stringify(config.data),
            ]);
        }
        return urlArr.join("&");
    }
    /**
     * 添加请求
     * @param {Object} config
     */
    const add = (config) => {
        // 校验是否配置不参与取消请求
        if (
            (config && config.headers && config.headers.isSkipCancelRequest) || (config && config.isSkipCancelRequest)
        ) {
            // 及时删除isSkipCancelRequest该配置 避免接口未配置接受headers参数白名单
            if (config && config.headers && config.headers.isSkipCancelRequest) {
                Reflect.deleteProperty(config.headers, 'isSkipCancelRequest')
            }
            return;
        }
        const url = getUrl(config);
        config.cancelToken =
            config.cancelToken ||
            new Axios.CancelToken((cancel) => {
                if (!pending.has(url)) {
                    pending.set(url, cancel);
                }
            });
    };

    /**
     * 移除请求
     * @param {Object} config
     */
    const remove = (config) => {
        const url = getUrl(config);
        if (pending.has(url)) {
            const cancel = pending.get(url);
            cancel(url);
            pending.delete(url);
        }
    };

    /**
     * 清空 pending 中的请求（在路由跳转时调用）
     */
    const clear = () => {
        for (const [url, cancel] of pending) {
            cancel(url);
        }
        pending.clear();
    };

    return {
        add,
        remove,
        clear,
    };
};
