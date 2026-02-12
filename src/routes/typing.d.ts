import type { RouteObject } from 'react-router-dom';

/**
 * 路由元数据配置
 */
export interface MetaProps {
  /** 页面标题（可选，主要用于备用） */
  title?: string;
  /** 是否需要身份认证 */
  auth: boolean;
  /** 允许访问的角色列表 */
  role?: string[];
  /** 是否精确匹配路由 */
  exact?: boolean;
  /**
   * 路由唯一标识（重要）
   *
   * 用途：
   * 1. 自动匹配国际化文本：`layout.menu.${key}`
   * 2. 自动生成侧边栏菜单项
   * 3. 自动设置浏览器标签页标题
   *
   * 命名规则：
   * - 使用驼峰命名或小写单词，如：home, userProfile, dataAnalysis
   * - 避免特殊字符和空格
   * - 需要在国际化文件中添加对应的 `layout.menu.${key}` 配置
   *
   * 示例：
   * key: 'editor' → 国际化配置：'layout.menu.editor': '编辑器' / 'Editor'
   */
  key?: string;
  /** 是否在菜单中隐藏（true: 隐藏，false/undefined: 显示） */
  hideInMenu?: boolean;
  /** 菜单图标名称（需在 SideBar 的 ICON_MAPPING 中配置对应的图标组件） */
  icon?: string;
  /** 菜单排序（数字越小越靠前） */
  order?: number;
  /** 菜单分组标识（用于将菜单项分组显示） */
  group?: string;
}

export type TRouteObject = RouteObject & {
  children?: TRouteObject[];
  meta?: MetaProps;
};
