import enUS from './en-US';
import zhCN from './zh-CN';

/**
 * 加载国际化
 * @param lang 语言类型
 * @returns 语言与语言集
 */
const loadLocale = (lang: string) => {
  let locale = 'zh-CN';
  let message: Record<string, string> = zhCN;
  switch (lang) {
    case 'en-US':
      locale = 'en-US';
      message = enUS;
      break;
    case 'zh-CN':
      locale = 'zh-CN';
      message = zhCN;
      break;
    default:
      locale = 'zh-CN';
      message = zhCN;
      break;
  }
  return { locale, message };
};

export default loadLocale;
