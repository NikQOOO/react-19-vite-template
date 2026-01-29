import { Suspense } from 'react';

import type { LazyExoticComponent } from 'react';

const LazyLoad = (Component: LazyExoticComponent<React.ComponentType>) => {
  'use no memo'; // 禁用 React Compiler 优化此函数

  return (
    <Suspense fallback={<div>loading</div>}>
      <Component />
    </Suspense>
  );
};

export default LazyLoad;
