import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { Navigate } from 'react-router';

import LazyLoad from './loader/lazy-load';

const PlainRoutes: RouteObject[] = [
  {
    path: 'preview',
    element: LazyLoad(lazy(() => import('@/views/Preview'))),
  },
  {
    path: '',
    element: <Navigate to="/404" />,
  },
  // {
  //   path: '*',
  //   element: <Navigate to="/404" />,
  // },
];

export default PlainRoutes;
