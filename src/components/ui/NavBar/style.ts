import { Breadcrumb } from 'antd';
import styled from 'styled-components';

const { Item } = Breadcrumb;

export const NavbarWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  width: 80%;
  height: 100%;
  padding-left: 12px;

  .breadcrumb-wrapper ol {
    display: flex;
    align-items: flex-end;
    flex-flow: row;
  }

  .breadcrumb-wrapper ol li a {
    /* stylelint-enable */
    display: -webkit-box;
    /* stylelint-disable */
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
`;

export const BreadcrumbItem = styled(Item)`
  cursor: pointer;
`;
