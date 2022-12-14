
import { ElLoading } from "element-plus";
import { addClass, removeClass } from "./dom";
import { getLoadingTarget } from './common';

class Loading {
    show(opts = {}) {
        // 获取loading指定区域
        const target = getLoadingTarget(opts.target);
        // 比对loading 对应target 是否已开启 就不关重开了
        if (target && target === window['$$LoadingTarget']) {
            console.log('[cars-framework-pc] 相同target不执行关闭loading', window['$$LoadingTarget']);
            return;
        }
        this.hide(() => {
            window['$$LoadingTarget'] = target;
            // 增加样式让loading做到不随区域高度而改变 update by boomer 2022-03-15 20:04:02
            addClass(target, "container-heiall-hidden");
            window['$$Loading'] = ElLoading.service(Object.assign({
                target,
                lock: true,
                background: 'rgba(255, 255, 255, 1)',
            }, opts));
        });
    }
    hide(cb) {
        if (window['$$LoadingTarget']) {
            removeClass(window['$$LoadingTarget'], "container-heiall-hidden");
            window['$$LoadingTarget'] = null;
        }
        window['$$Loading'] && window['$$Loading'].close();
        cb && cb();
    }
}

const loading = new Loading();

export default loading;
