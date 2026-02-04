import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import qs from 'qs';

import RequestInstantFactory from './request';

// 导出管理器供外部使用
export { refreshManager } from '@/utils/request/refreshManager';
export { requestCancelManager } from '@/utils/request/requestCancelManager';

/**请求实例 */
let instance: AxiosInstance | null = null;

const createInstance = () => {
  instance = new RequestInstantFactory({
    baseURL: import.meta.env.VITE_APP_API!,
  }).getInstance();
};

/**
 * 通用请求方法
 * 已集成请求取消管理器和 token 刷新机制
 *
 * @param url - 请求地址
 * @param config - axios 配置项
 * @returns 响应数据
 *
 * @example
 * const data = await request<User>('/api/user', { method: 'GET' });
 */
export const request = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  if (!instance) {
    createInstance();
  }

  try {
    const { data } = await instance!.request<T>({
      url,
      ...config,
    });
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.error('Request canceled:', error.message);
    }
    throw error;
  }
};

/**获取带有响应头请求 */
export const requestWidthHeaders = async <T>(url: string, config?: AxiosRequestConfig) => {
  if (!instance) {
    createInstance();
  }
  const { data, headers } = await instance!.request<T>({
    url,
    ...config,
    paramsSerializer: {
      serialize(params) {
        return qs.stringify(params, { arrayFormat: 'brackets' });
      },
    },
  });
  return { data, headers };
};

/**清除请求实例 */
export const removeHttpInstance = () => {
  instance = null;
};

export default request;
