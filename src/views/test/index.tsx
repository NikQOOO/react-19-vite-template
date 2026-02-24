import { Typography } from 'antd';
import { Outlet } from 'react-router';

const Test = () => {
  return (
    <div>
      <Typography.Title level={1}>Demo</Typography.Title>
      <Outlet />
    </div>
  );
};

export default Test;
