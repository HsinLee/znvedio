
/**
 * 获取当前环境变量
 * @returns
 */
export const getENV = () => {

    if (import.meta.env.VITE_APP_CURRENTMODE === 'production') {
        return "production";
    }
    if (import.meta.env.VITE_APP_CURRENTMODE === 'mock') {
        return "mock";
    }
    if (import.meta.env.VITE_APP_CURRENTMODE === 'development') {
        return "development";
    }
    return "development";
};
