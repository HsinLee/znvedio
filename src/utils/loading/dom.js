/**
 * 是否含有样式
 */
 const hadClass = (ele, cln) => {
  if (!document.querySelector(ele)) {
    return false;
  }
  return (' ' + document.querySelector(ele).className + ' ').indexOf(' ' + cln + ' ') > -1;
};

/**
 * 移除样式
 */
const removeClass = (ele, cln) => {
  if (document.querySelector(ele) && document.querySelector(ele).classList) {
    document.querySelector(ele).classList.remove(cln);
  }
};

/**
 * 添加样式
 */
const addClass = (ele, cln) => {
  if (document.querySelector(ele) && document.querySelector(ele).classList) {
    document.querySelector(ele).classList.add(cln);
  }
};

/**
 * 切换样式
 */
const toggleClass = (ele, cln) => {
  if (hadClass(ele, cln)) {
    removeClass(ele, cln);
  } else {
    addClass(ele, cln);
  }
};

/**
 * 通用切换body主题
 */
const toggleBodyTheme = (isStyleDark) => {
  if (isStyleDark) {
    if (!hadClass('body', 'night-mode')) {
      addClass('body', 'night-mode');
    }
  } else {
    removeClass('body', 'night-mode');
  }
};

export {
  hadClass,
  toggleClass,
  addClass,
  removeClass,
  toggleBodyTheme,
};
