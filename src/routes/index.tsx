import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';

import ErrorPge from '@/components/ErrorPge';
import MainLayout from '@/layouts/Main';
import PlainLayout from '@/layouts/Plain';

import LazyLoad from './loader/lazy-load';
import MainRoutes from './main';
import PlainRoutes from './Plain';

import type { TRouteObject } from './typing';

export const rootRoutes = [
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPge />,
    meta: {
      key: 'main-layout',
      auth: false,
    },
    children: [...MainRoutes],
  },
  {
    path: '/plain',
    element: <PlainLayout />,
    meta: {
      key: 'plain-layout',
      auth: false,
    },
    children: [...PlainRoutes],
  },
  // Redirect Pages
  {
    path: '401',
    element: LazyLoad(lazy(() => import('@/components/RedirectPage/AuthPage'))),
    meta: {
      hideInMenu: true,
      auth: false,
    },
  },
  {
    path: '404',
    element: LazyLoad(lazy(() => import('@/components/RedirectPage/NotFoundPage'))),
    meta: {
      hideInMenu: true,
      auth: false,
    },
  },
] as TRouteObject[];

const router = createBrowserRouter(rootRoutes);

export default router;
