import { Outlet } from 'react-router';

const Test = () => {
  return (
    <div>
      <h1>Test Page</h1>
      <Outlet />
    </div>
  );
};

export default Test;
