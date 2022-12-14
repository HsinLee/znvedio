/**
 * loading通用方法
 */

/**
 * 获取loadingTarget
 * @param target
 * @returns
 */
export const getLoadingTarget = (target) => {
  if (!target) {
    const containerMainDom = document.querySelector("#container-main"); // 检测是否中台项目独有判定右侧区域
    if (containerMainDom) {
      // 检测是否抽屉弹起
      const drawerDom = document.querySelector(".el-drawer__body");
      if (drawerDom) {
        target = ".el-drawer__body";
      } else {
        target = "#container-main";
      }
    } else {
      target = "body";
    }
  }
  return target;
};
