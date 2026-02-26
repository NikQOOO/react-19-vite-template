import { Outlet } from 'react-router';

const Test = () => {
  return (
    <div style={{ padding: 20 }}>
      <Outlet />
    </div>
  );
};

export default Test;
