import { useEffect } from 'react';
import { useIntl } from 'react-intl';

/**
 * 动态设置浏览器标签页标题
 * @param title - 标题文本或国际化 key
 * @param useI18n - 是否使用国际化翻译
 * @param suffix - 标题后缀，默认为应用名称
 */
export const useDocumentTitle = (
  title?: string,
  useI18n: boolean = true,
  suffix: string = 'React Template',
) => {
  const intl = useIntl();

  useEffect(() => {
    if (!title) {
      document.title = suffix;
      return;
    }

    let pageTitle = title;

    // 如果需要使用国际化
    if (useI18n) {
      try {
        pageTitle = intl.formatMessage({ id: title });
      } catch {
        // 如果国际化 key 不存在，直接使用原始文本
        pageTitle = title;
      }
    }

    // 设置完整标题
    document.title = suffix ? `${pageTitle} - ${suffix}` : pageTitle;

    // 清理函数：组件卸载时重置为默认标题
    return () => {
      document.title = suffix;
    };
  }, [title, useI18n, suffix, intl]);
};

export default useDocumentTitle;
