import { useCallback, useEffect, useMemo, useState } from 'react';

import { settingsStore } from '@/storage/instance';

import { ThemeContext, type TTheme } from './useTheme';

const THEME_KEY = 'theme';
const USER_SET_KEY = 'user-set-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ========================= State =========================
  // 初始值使用系统偏好，然后异步加载保存的主题
  const [theme, setTheme] = useState<TTheme>(() => {
    // 默认使用系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // ========================= Handlers =========================
  /** 切换主题 */
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      // 异步保存到 localforage
      settingsStore.setItem(THEME_KEY, newTheme);
      // 标记为用户手动设置
      settingsStore.setItem(USER_SET_KEY, true);
      return newTheme;
    });
  }, []);

  // ========================= Computed =========================
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  // ========================= Effects =========================
  // 异步加载保存的主题
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await settingsStore.getItem<TTheme>(THEME_KEY);
      if (savedTheme) {
        setTheme(savedTheme);
      }
    };
    loadTheme();
  }, []);

  // 将主题应用到根元素
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // 监听系统主题变化（仅在用户未手动设置时生效）
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = async (e: MediaQueryListEvent) => {
      // 检查用户是否已手动设置
      const isUserSet = await settingsStore.getItem<boolean>(USER_SET_KEY);
      if (isUserSet) {
        return;
      }
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
      await settingsStore.setItem(THEME_KEY, newTheme);
    };

    // 需要类型转换，因为 addEventListener 不支持异步回调
    mediaQuery.addEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
    return () =>
      mediaQuery.removeEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
  }, []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
