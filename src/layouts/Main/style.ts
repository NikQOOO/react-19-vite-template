import styled from 'styled-components';

export const Layout = styled.div.attrs({
  'aria-label': 'main-layout',
})`
  height: 100%;
`;

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  background: var(--bg-color);
`;

export const Content = styled.main.attrs({
  'aria-label': 'main-content',
})`
  position: relative;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
`;
