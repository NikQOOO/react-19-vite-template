import { Outlet } from 'react-router';

const PlainLayout = () => {
  return (
    <div aria-label="blank-layout">
      <Outlet />
    </div>
  );
};

export default PlainLayout;
