import type { TRouteObject } from '@/routes/typing';

/**
 * 根据当前路径从路由配置中获取页面的 key
 * @param routes - 路由配置数组
 * @param pathname - 当前路径
 * @returns 页面的 key 或 undefined
 */
export const getPageKeyFromRoute = (
  routes: TRouteObject[],
  pathname: string,
): string | undefined => {
  const pathSegments = pathname.split('/').filter(Boolean);

  /**
   * 递归查找匹配的路由 key
   * @param routeList 路由列表
   * @param segments 路径段数组
   * @param index 当前索引
   * @returns 匹配的路由 key 或 undefined
   */
  const findKey = (
    routeList: TRouteObject[],
    segments: string[],
    index: number = 0,
  ): string | undefined => {
    for (const route of routeList) {
      // 处理 index 路由
      if (route.index && segments.length === index) {
        return route.meta?.key;
      }

      // 匹配当前路径段
      if (route.path === segments[index]) {
        // 如果是最后一段，返回 key
        if (index === segments.length - 1) {
          return route.meta?.key;
        }

        // 如果有子路由，继续递归查找
        if (route.children) {
          const childKey = findKey(route.children, segments, index + 1);
          if (childKey) {
            return childKey;
          }
        }
      }

      // 检查子路由
      if (route.children) {
        const childKey = findKey(route.children, segments, index);
        if (childKey) {
          return childKey;
        }
      }
    }

    return undefined;
  };

  return findKey(routes, pathSegments);
};
