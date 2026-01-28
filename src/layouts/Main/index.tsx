import { Outlet } from 'react-router';

import { Container, Content, Layout } from './style';

const MainLayout = () => {
  return (
    <Layout>
      <Container>
        <Content>
          <Outlet />
        </Content>
      </Container>
    </Layout>
  );
};

export default MainLayout;
