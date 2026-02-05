import styled from 'styled-components';

const SIDE_BAR_WIDTH = 50;

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

export const SideBarPlaceholder = styled.div<Layout.ISideStyleProps>((props) => {
  let dynamicWidth = '240px';
  if (props.$collapse === 'true') {
    dynamicWidth = `${SIDE_BAR_WIDTH}px`;
  }
  return {
    flex: `0 0 ${dynamicWidth}`,
    width: dynamicWidth,
    minWidth: dynamicWidth,
    maxWidth: dynamicWidth,
    overflow: 'hidden',
    transition: `background-color 0.3s ease 0s, min-width 0.3s ease 0s,
    max-width 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) 0s`,
  };
});
export const ContentWrapper = styled.div<Layout.ISideStyleProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: ${(props) => (props.$collapse === 'true' ? 'calc(100% - 50px)' : 'calc(100% - 240px)')};
  min-height: calc(100vh - 20px);
  background: var(--bg-color);
  transition: width 0.3s linear;
`;

export const TopBarWrapper = styled.header.attrs({
  'aria-label': 'layout-header',
  id: 'layout-header',
})<Layout.ISideStyleProps>`
  position: fixed;
  left: ${(props) => (props.$collapse === 'true' ? `${SIDE_BAR_WIDTH}px` : '240px')};
  right: 0;
  box-sizing: border-box;
  height: 50px;
  line-height: 50px;
  background: #fff;
  box-shadow: 0 4px 10px 0 rgb(78 89 105 / 6%);
  z-index: 1000;
  transition: all 0.2s;
`;

export const TopBarPlaceholder = styled.div`
  box-sizing: border-box;
  width: 100%;
  height: 50px;
`;

export const SideBarWrapper = styled.aside.attrs({
  'aria-label': 'side-bar',
})<Layout.ISideStyleProps>((props) => {
  let dynamicWidth = '240px';
  if (props.$collapse === 'true') {
    dynamicWidth = `${SIDE_BAR_WIDTH}px`;
  }
  return {
    position: 'fixed',
    left: 0,
    top: 0,
    width: dynamicWidth,
    height: '100%',
    minWidth: dynamicWidth,
    maxWidth: dynamicWidth,
    overflow: 'hidden',
    zIndex: 99,
    boxShadow: '2px 0 8px 0 rgb(29 35 41 / 5%)',
    background: 'var(--side-bar-bg-color)',
    transition: 'all 0.2s',
  };
});
