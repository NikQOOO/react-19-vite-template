import type { RouteObject } from 'react-router-dom';

export interface MetaProps {
  title?: string;
  auth: boolean;
  role?: string[];
  exact?: boolean;
  /** 当前路径 */
  key?: string;
  hideInMenu?: boolean;
}

export type TRouteObject = RouteObject & {
  children?: TRouteObject[];
  meta?: MetaProps;
};
