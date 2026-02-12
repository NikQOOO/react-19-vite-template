import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useShallow } from 'zustand/react/shallow';

import { useDocumentTitle } from '@/common/hooks/useDocumentTitle';
import { rootRoutes } from '@/routes';
import { usePlatformStore } from '@/store/system/index.store';
import { getPageKeyFromRoute } from '@/utils/getPageTitle';

import SideBar from '@/components/ui/SideBar';

import TopBar from '@/components/ui/TopBar';
import {
  Container,
  Content,
  ContentWrapper,
  Layout,
  SideBarPlaceholder,
  SideBarWrapper,
  TopBarPlaceholder,
  TopBarWrapper,
} from './style';

const MainLayout = () => {
  const location = useLocation();

  const { collapse, setCollapse, isShowHeader } = usePlatformStore(
    useShallow((state) => ({
      collapse: state.collapse,
      setCollapse: state.setCollapse,
      isShowHeader: state.isShowHeader,
    })),
  );

  // 动态获取当前页面标题
  const pageTitle = useMemo(() => {
    const mainLayout = rootRoutes.find((route) => route.meta?.key === 'main-layout');
    if (mainLayout?.children) {
      const routeKey = getPageKeyFromRoute(mainLayout.children, location.pathname);
      if (routeKey) {
        return `layout.menu.${routeKey}`;
      }
    }
    return undefined;
  }, [location.pathname]);

  // 设置浏览器标签页标题
  useDocumentTitle(pageTitle);

  return (
    <Layout>
      <Container>
        <SideBarPlaceholder $collapse={collapse.toString()} />
        <SideBarWrapper $collapse={collapse.toString()}>
          <SideBar collapse={collapse} setCollapse={setCollapse} />
        </SideBarWrapper>
        <ContentWrapper $collapse={collapse.toString()}>
          {isShowHeader && (
            <>
              <TopBarWrapper $collapse={collapse.toString()}>
                <TopBar />
              </TopBarWrapper>
              <TopBarPlaceholder />
            </>
          )}
          <Content>
            <Outlet />
          </Content>
        </ContentWrapper>
      </Container>
    </Layout>
  );
};

export default MainLayout;
