import { lazy } from 'react';

import AuthLoader from './loader/auth-loader';
import LazyLoad from './loader/lazy-load';

import type { TRouteObject } from './typing';

/**
 * *主路由配置*
 *
 * ## meta.key 命名规则与国际化对应关系说明
 *
 * 1. key 的作用：
 *    - 用于侧边栏菜单显示
 *    - 自动设置浏览器标签页标题
 *    - 匹配国际化文本
 *
 * 2. key 的命名规则：
 *    - 使用驼峰命名法（推荐）：userProfile, dataAnalysis
 *    - 使用小写单词（可选）：home, editor, settings
 *    - 避免使用特殊字符和空格
 *    - 保持简洁且语义化
 *
 * 3. 国际化对应关系：
 *    meta.key 会自动映射到国际化配置：`layout.menu.${key}`
 *
 *    示例：
 *    meta: { key: 'home' }
 *    → 对应国际化 key: 'layout.menu.home'
 *    → 中文配置：'layout.menu.home': '首页'
 *    → 英文配置：'layout.menu.home': 'Home'
 *
 * 4. 浏览器标题显示：
 *    访问页面时，标题格式为：[国际化文本] - [应用名称]
 *    示例：
 *    - 访问 /editor → 标题显示：编辑器 - React Template (中文)
 *    - 访问 /editor → 标题显示：Editor - React Template (英文)
 *
 * 5. 嵌套路由的 key：
 *    子路由的 key 只需设置自己的标识，不需要拼接父路由
 *
 *    示例：
 *    - 父路由: { path: 'settings', meta: { key: 'settings' } }
 *    - 子路由: { path: 'profile', meta: { key: 'profile' } }
 *    → 国际化配置：
 *       - 'layout.menu.settings': '设置'
 *       - 'layout.menu.profile': '个人资料'
 *
 * 6. 添加新路由的步骤：
 *    1. 步骤1: 在此文件添加路由配置，设置 meta.key
 *    2. 步骤2: 在 src/locale/zh-CN/layout.ts 添加：'layout.menu.{key}': '中文名称'
 *    3. 步骤3: 在 src/locale/en-US/layout.ts 添加：'layout.menu.{key}': 'English Name'
 *    4. 步骤4: 完成！侧边栏和标题会自动更新
 *
 * 7. 可选配置：
 *    - icon: 菜单图标名称（需在 SideBar 的 ICON_MAPPING 中配置）
 *    - order: 菜单排序
 *    - hideInMenu: 设为 true 则不在侧边栏显示
 *    - auth: 是否需要认证
 */
const MainRoutes: TRouteObject[] = [
  {
    index: true,
    element: LazyLoad(lazy(() => import('@/views/home'))),
    meta: {
      key: 'home',
      title: 'Home',
      auth: false,
      icon: 'dashboard',
      order: 1,
    },
  },
  {
    path: 'editor',
    element: LazyLoad(lazy(() => import('@/views/editor'))),
    loader: AuthLoader,
    meta: {
      key: 'editor',
      title: 'Editor',
      auth: true,
      icon: 'edit',
      order: 2,
    },
  },
  {
    path: 'test',
    element: LazyLoad(lazy(() => import('@/views/test'))),
    meta: {
      key: 'test',
      title: 'Test',
      auth: false,
      order: 3,
    },
    children: [
      {
        path: 'demo1',
        element: LazyLoad(lazy(() => import('@/views/test/demo1'))),
        meta: {
          key: 'demo1',
          title: 'Demo 1',
          auth: false,
        },
      },
      {
        path: 'demo2',
        element: LazyLoad(lazy(() => import('@/views/test/demo2'))),
        meta: {
          key: 'demo2',
          title: 'Demo 2',
          auth: false,
        },
      },
      {
        path: 'demo3',
        element: LazyLoad(lazy(() => import('@/views/test/demo3'))),
        meta: {
          key: 'demo3',
          title: 'Demo 3',
          auth: false,
        },
      },
    ],
  },
];

export default MainRoutes;
