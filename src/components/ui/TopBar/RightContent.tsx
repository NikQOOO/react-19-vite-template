import { GlobalOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import loadLocale from '@/locale';
import { logout } from '@/services/api';
import { usePlatformStore, useUserStore } from '@/store/system/index.store';

import { Container, MyAvatar } from './style';

const TopBar = () => {
  const { reset } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      setUser: state.setUser,
      reset: state.reset,
    })),
  );

  const { lang, setLang } = usePlatformStore(
    useShallow((state) => ({
      lang: state.lang,
      setLang: state.setLang,
    })),
  );

  const { message } = useMemo(() => loadLocale(lang), [lang]);

  const handleLogout = useCallback(() => {
    reset();
    logout();
  }, [reset]);

  const handleLanguageChange = useCallback(
    (key: SystemStore.TLang) => {
      setLang(key);
    },
    [setLang],
  );

  /** 获取名称 */
  const FullName = () => {
    const name = 'DEV';
    if (name) {
      return { name, subName: name.substring(0, 1).toUpperCase() };
    }
    return {
      name: '-',
      subName: '-',
    };
  };

  const languageItems: MenuProps['items'] = [
    {
      key: 'zh-CN',
      label: message['layout.language.chinese'],
    },
    {
      key: 'en-US',
      label: message['layout.language.english'],
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: message['layout.logout'],
      onClick: handleLogout,
    },
  ];

  // 同步更新 HTML 的 lang 属性
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <Container>
      <Space size={16} style={{ userSelect: 'none' }}>
        <Dropdown
          placement="bottom"
          arrow
          menu={{
            items: languageItems,
            selectedKeys: [lang],
            onClick: ({ key }) => handleLanguageChange(key as SystemStore.TLang),
          }}
        >
          <Space size={8} style={{ height: 32, cursor: 'pointer' }}>
            <GlobalOutlined style={{ fontSize: 16 }} />
          </Space>
        </Dropdown>
        <Dropdown placement="bottom" arrow menu={{ items: userMenuItems }}>
          <Space size={8} style={{ height: 32, cursor: 'pointer' }}>
            <MyAvatar size="small" draggable={false}>
              {FullName().subName}
            </MyAvatar>
          </Space>
        </Dropdown>
      </Space>
    </Container>
  );
};

export default TopBar;
