import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import qs from 'qs';

import RequestInstantFactory from './request';

/**请求实例 */
let instance: AxiosInstance | null = null;

const createInstance = () => {
  instance = new RequestInstantFactory({
    baseURL: process.env.REACT_APP_API!,
  }).getInstance();
};

// 失败重连3次 react-query 已有
// axiosRetry(instance, { retries: 3 });
export const request = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  if (!instance) {
    createInstance();
  }

  const cancelTokenSource = axios.CancelToken.source();

  try {
    const { data } = await instance!.request({
      url,
      ...config,
      cancelToken: cancelTokenSource.token,
    });
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.error('Request canceled', error.message);
    } else {
      throw error;
    }
    return Promise.reject(error);
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
