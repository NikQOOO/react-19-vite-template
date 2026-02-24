import { createContext, useContext } from 'react';

export type TTheme = 'light' | 'dark';

export interface IThemeContext {
  theme: TTheme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<IThemeContext | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
