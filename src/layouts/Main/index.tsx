import { Outlet } from 'react-router';
import { useShallow } from 'zustand/react/shallow';

import { usePlatformStore } from '@/store/system/index.store';

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
  const { collapse, setCollapse, isShowHeader } = usePlatformStore(
    useShallow((state) => ({
      collapse: state.collapse,
      setCollapse: state.setCollapse,
      isShowHeader: state.isShowHeader,
    })),
  );

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
