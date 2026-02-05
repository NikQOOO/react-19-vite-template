import { ConfigProvider } from 'antd';
import antdEnUS from 'antd/locale/en_US';
import antdZhCN from 'antd/locale/zh_CN';
import { IntlProvider } from 'react-intl';
import { RouterProvider } from 'react-router';

import loadLocale from './locale';
import router from './routes';
import { usePlatformStore } from './store/system/index.store';

import type { ThemeConfig } from 'antd';

const intlMapping = {
  'zh-CN': antdZhCN,
  'en-US': antdEnUS,
};

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#39c5bb',
    colorSuccess: '#06bf9c',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 4,
    fontFamily: `HarmonyOS_Sans_Regular, PingFangSC-Regular, -apple-system, BlinkMacSystemFont, Segoe UI,
      PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, Helvetica, Arial, sans-serif,
      Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol`,
    colorLink: '#39c5bb',
    colorLinkActive: '#39c5bb',
    colorLinkHover: '#39c5bb',
  },
  components: {
    Menu: {
      collapsedWidth: 50,
      itemBg: 'transparent',
      itemColor: 'rgba(255, 255, 255, 0.7)',
      itemHoverBg: 'transparent',
      itemHoverColor: 'rgba(255, 255, 255, 0.7)',
      itemActiveBg: 'transparent',
      itemSelectedColor: '#fff',
      itemSelectedBg: '#39c5bb',
      popupBg: '#2E3540',
      subMenuItemBorderRadius: 6,
      subMenuItemBg: 'transparent',
    },
    Button: {
      borderRadius: 6,
    },
    Steps: {
      iconSizeSM: 14,
    },
  },
};

function App() {
  const lang = usePlatformStore((state) => state.lang);
  const { locale, message } = loadLocale(lang);

  return (
    <div id="app">
      <IntlProvider messages={message} defaultLocale="en-US" locale={locale}>
        <ConfigProvider theme={theme} locale={intlMapping[locale as 'zh-CN' | 'en-US']}>
          <RouterProvider router={router} />
        </ConfigProvider>
      </IntlProvider>
    </div>
  );
}

export default App;
