/**
 * HTTP请求实例工厂
 * 用于创建和管理请求实例
 * @author @pureJim
 */
import axios from 'axios';
import qs from 'qs';

import type {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  CreateAxiosDefaults,
  HeadersDefaults,
  InternalAxiosRequestConfig,
  RawAxiosRequestHeaders,
} from 'axios';

import { errorCodeParser } from './parser';

interface IRequestConfig {
  baseURL: string;
  headers?: RawAxiosRequestHeaders | AxiosHeaders | Partial<HeadersDefaults>;
  interceptors?: {
    request?: {
      onFulfilled?: (
        config: InternalAxiosRequestConfig,
      ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
      onRejected?: (error: unknown) => unknown;
    };
    response?: {
      onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
      onRejected?: (error: AxiosError) => unknown;
    };
  };
  timeout?: number;
  withCredentials?: boolean;
}

const TOKEN_KEY = 'token';

class RequestMagic {
  private static instances = new Map<string, AxiosInstance>();

  private constructor() {}

  /**
   * 获取请求实例
   * @param config 请求配置
   * @param instanceKey 实例唯一标识，不传则使用baseURL作为key
   * @returns AxiosInstance
   */
  public static getInstance(config: IRequestConfig, instanceKey?: string): AxiosInstance {
    const key = instanceKey || config.baseURL;

    if (!this.instances.has(key)) {
      const { baseURL, headers, interceptors, timeout, withCredentials } = config;

      const axiosInitialConfig: CreateAxiosDefaults = {
        baseURL,
        timeout: timeout || 10000,
      };

      if (headers) {
        axiosInitialConfig.headers = headers;
      }

      if (withCredentials) {
        axiosInitialConfig.withCredentials = withCredentials;
      }

      const instance = axios.create(axiosInitialConfig);

      instance.defaults.paramsSerializer = {
        serialize(params) {
          return qs.stringify(params, { arrayFormat: 'brackets' });
        },
      };

      // 请求拦截
      instance.interceptors.request.use(
        (requestConfig) => {
          // 获取token的逻辑可以抽离到拦截器配置中
          const token = localStorage.getItem(TOKEN_KEY) || '';
          if (token) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
          }

          // 应用自定义请求拦截器
          if (interceptors?.request?.onFulfilled) {
            return interceptors.request.onFulfilled(requestConfig);
          }
          return requestConfig;
        },
        (error) => {
          if (interceptors?.request?.onRejected) {
            return interceptors.request.onRejected(error);
          }
          return Promise.reject(error as Error);
        },
      );

      // 响应拦截
      instance.interceptors.response.use(
        (response: AxiosResponse) => {
          // 应用自定义响应成功拦截器
          if (interceptors?.response?.onFulfilled) {
            return interceptors.response.onFulfilled(response);
          }
          return response;
        },
        async (error: AxiosError) => {
          // 应用自定义响应错误拦截器
          if (interceptors?.response?.onRejected) {
            return interceptors.response.onRejected(error);
          }

          if (error.response?.status === 401) {
            // 统一处理未授权情况
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/login';
          } else {
            console.warn(errorCodeParser(error));
          }
          return Promise.reject(new Error(errorCodeParser(error)));
        },
      );

      this.instances.set(key, instance);
    }

    return this.instances.get(key)!;
  }

  /**
   * 清除请求实例
   * @param instanceKey 实例唯一标识
   */
  public static clearInstance(instanceKey: string) {
    if (this.instances.has(instanceKey)) {
      this.instances.delete(instanceKey);
    }
  }

  /**
   * 清除所有请求实例
   */
  public static clearAllInstances() {
    this.instances.clear();
  }
}

export default RequestMagic;
