import {
  FileTextOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Button, Menu, Space } from 'antd';
import classNames from 'classnames';
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router';

import mainRoutes from '@/routes/main';

import type { TRouteObject } from '@/routes/typing';
import type { MenuProps } from 'antd';
import type { JSX } from 'react';

import {
  MenuWrapper,
  SideBarActionWrapper,
  SideBarContainer,
  SidebarLogo,
  SideBarLogoWrapper,
} from './style';

type MenuItem = Required<MenuProps>['items'][number];

interface INestMenu {
  path: string;
  key: string;
  children?: INestMenu[];
}

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group' | 'divider',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const ICON_MAPPING: Record<string, React.ReactElement> = {
  dashboard: <HomeOutlined />,
  toxicologyIND: <FileTextOutlined />,
};

const SideBar: React.FC<Layout.ISideProps> = (props) => {
  const { collapse, setCollapse } = props;

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const intl = useIntl();

  const selectedPath = useMemo(() => {
    const paths = pathname.split('/').filter((item) => !!item);
    return paths.length > 0 ? paths : [''];
  }, [pathname]);

  const handleCollapse = () => {
    setCollapse(!collapse);
  };

  const handleNavigate = (keyPath: string[]) => {
    const path = keyPath.reverse().join('/');
    navigate(path);
  };

  /** 组合左侧菜单数据 */
  const composeMenuData = useCallback((originList: TRouteObject[], prefix: string): INestMenu[] => {
    const composeRecursive = (list: TRouteObject[], pfx: string): INestMenu[] => {
      let selfPrefix = pfx;
      if (selfPrefix) {
        selfPrefix += '-';
      }
      const nestMenu = list
        .filter((item) => !item.meta?.hideInMenu)
        .map((payload) => {
          const item = payload;
          const params: INestMenu = {
            path: item.path || '',
            key: `${selfPrefix}${item.path || ''}`,
          };
          if (item.children) {
            params.children = composeRecursive(item.children, item.path || '');
          }
          return params;
        });
      return nestMenu;
    };
    return composeRecursive(originList, prefix);
  }, []);

  /** 组合菜单 */
  const composeMenu = useCallback(
    (payload: INestMenu[], isRoot?: boolean): MenuItem[] => {
      const compose = (items: INestMenu[], root?: boolean): MenuItem[] => {
        const rst: MenuItem[] = [];
        items.forEach((item, idx) => {
          if (item.path === 'divider') {
            rst.push(getItem(' ', item.path + idx, null, undefined, 'divider'));
            return;
          }
          let icon: JSX.Element | null = null;
          // 路由的 key 匹配映射表中的 key，value 对应 iconfont 的 class
          if (root && item.key in ICON_MAPPING) {
            // if (selectedPath.length > 0 && item.key === selectedPath[0]) {
            // }
            icon = ICON_MAPPING[item.key];
          }
          if (item.children && item.children.length > 0) {
            rst.push(
              getItem(
                intl.formatMessage({ id: `layout.menu.${item.key}` }),
                item.path,
                icon,
                compose(item.children),
              ),
            );
          } else {
            rst.push(
              getItem(
                <Space>
                  <span>{intl.formatMessage({ id: `layout.menu.${item.key}` })}</span>
                </Space>,
                item.path,
                icon,
              ),
            );
          }
        });
        return rst;
      };
      return compose(payload, isRoot);
    },
    [intl],
  );

  const items: MenuItem[] = useMemo(() => {
    let menu: INestMenu[] = [];
    const menuOriginList = mainRoutes.find((item) => item.meta?.key === 'main-layout');
    if (menuOriginList && menuOriginList.children) {
      menu = composeMenuData(menuOriginList.children.slice(0, -1), '');
    }

    return composeMenu(menu, true);
  }, [composeMenu, composeMenuData]);

  return (
    <SideBarContainer>
      <SideBarLogoWrapper>
        <SidebarLogo
          className={classNames({
            collapsed: collapse,
          })}
        >
          <span>React Template</span>
        </SidebarLogo>
      </SideBarLogoWrapper>
      <MenuWrapper>
        <Menu
          defaultSelectedKeys={['home']}
          mode="inline"
          inlineCollapsed={collapse}
          items={items}
          selectedKeys={selectedPath}
          onSelect={({ keyPath }) => handleNavigate(keyPath)}
        />
      </MenuWrapper>
      <SideBarActionWrapper>
        <Button type="text" aria-label="collapse" onClick={handleCollapse}>
          {collapse ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </Button>
      </SideBarActionWrapper>
    </SideBarContainer>
  );
};

export default SideBar;
