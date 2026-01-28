import type { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from 'axios';
import axios from 'axios';
import axiosRetry from 'axios-retry';

import RequestMagic from './request';

// 请求配置类型
interface RequestOptions extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
  withHeaders?: boolean;
  cache?: boolean;
  cacheTime?: number;
  limitRequest?: boolean;
}

// 缓存数据类型
interface CacheData<T = unknown> {
  timestamp: number;
  data: T;
}

// 请求缓存管理
const requestCache = new Map<string, CacheData>();

// 缓存请求Key生成函数
const generateCacheKey = (url: string, config?: AxiosRequestConfig): string => {
  return `${url}${config ? JSON.stringify(config) : ''}`;
};

// 正在进行中的请求缓存
const pendingRequests = new Map<string, CancelTokenSource>();

// 请求实例
let instance: AxiosInstance | null = null;

// 创建请求实例并配置默认值
const createInstance = () => {
  instance = RequestMagic.getInstance(
    {
      baseURL: import.meta.env.VITE__API!,
      timeout: 15000,
      interceptors: {
        response: {
          onFulfilled: (response) => {
            // 从pendingRequests移除已完成的请求
            const url = response.config.url!;
            const method = response.config.method || 'get';
            const requestKey = `${method}:${url}`;
            pendingRequests.delete(requestKey);
            return response;
          },
        },
      },
    },
    'default',
  );
};

/**
 * 泛型请求函数
 * @param url 请求地址
 * @param options 请求选项
 * @returns Promise<T>
 */
export const request = async <T, R = T>(url: string, options?: RequestOptions): Promise<R> => {
  if (!instance) {
    createInstance();
  }

  const {
    retries = 3,
    retryDelay = 3000,
    withHeaders = false,
    cache = false,
    cacheTime = 30 * 1000, // 默认缓存30秒
    limitRequest = false,
    ...config
  } = options || {};

  // 检查缓存
  if (cache) {
    const cacheKey = generateCacheKey(url, config);
    const cachedData = requestCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < cacheTime) {
      return cachedData.data as R;
    }
  }

  // 配置失败重连
  axiosRetry(instance!, {
    retries,
    retryDelay: () => retryDelay,
  });

  // 创建取消令牌
  const cancelTokenSource = axios.CancelToken.source();

  // 取消同一URL上已存在的请求
  const method = config?.method || 'get';
  const requestKey = `${method}:${url}`;

  // 限制请求
  if (limitRequest && pendingRequests.has(requestKey)) {
    pendingRequests.get(requestKey)!.cancel('Request canceled due to duplicate request');
  }

  pendingRequests.set(requestKey, cancelTokenSource);

  try {
    const response = await instance!.request<T>({
      url,
      ...config,
      cancelToken: cancelTokenSource.token,
    });

    // 缓存响应数据
    if (cache) {
      const cacheKey = generateCacheKey(url, config);
      requestCache.set(cacheKey, {
        timestamp: Date.now(),
        data: withHeaders ? { data: response.data, headers: response.headers } : response.data,
      });
    }

    const result = withHeaders ? { data: response.data, headers: response.headers } : response.data;

    return result as R;
  } catch (error) {
    pendingRequests.delete(requestKey);

    if (axios.isCancel(error)) {
      console.warn('请求已取消', error.message);
    }

    return Promise.reject(error as Error);
  }
};

/**
 * 取消所有进行中的请求
 */
export const cancelAllRequests = () => {
  pendingRequests.forEach((source) => {
    source.cancel('用户取消所有请求');
  });
  pendingRequests.clear();
};

/**
 * 取消指定URL的请求
 * @param url 请求URL
 * @param method 请求方法，默认为get
 */
export const cancelRequest = (url: string, method: string = 'get') => {
  const requestKey = `${method}:${url}`;

  if (pendingRequests.has(requestKey)) {
    pendingRequests.get(requestKey)!.cancel('用户取消请求');
    pendingRequests.delete(requestKey);
  }
};

/**
 * 清除请求缓存
 * @param url 可选，指定URL的缓存，不传则清除所有缓存
 */
export const clearRequestCache = (url?: string) => {
  if (url) {
    // 清除特定URL的所有缓存
    requestCache.forEach((_, key) => {
      if (key.startsWith(url)) {
        requestCache.delete(key);
      }
    });
  } else {
    // 清除所有缓存
    requestCache.clear();
  }
};

/**
 * 清除请求实例并取消所有请求
 */
export const removeHttpInstance = () => {
  cancelAllRequests();
  clearRequestCache();
  instance = null;
};

export default request;
