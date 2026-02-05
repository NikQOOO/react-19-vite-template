import { Avatar, Modal, Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

export const Container = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
`;

export const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 0 0 60px;
  padding: 0 16px;
  background-color: #fff;
`;

export const MyModal = styled(Modal)`
  .ant-modal-content {
    padding: 0;
  }
`;

export const MyAvatar = styled(Avatar)`
  color: #fff;
  background-color: var(--theme-color);
  font-weight: 600;
`;

export const UsernameWrapper = styled(Text)`
  /* stylelint-disable */
  display: -webkit-box;
  /* stylelint-enable */
  min-width: 50px;
  max-width: 150px;
  text-transform: capitalize;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;
