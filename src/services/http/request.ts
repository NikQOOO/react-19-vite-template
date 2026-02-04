/**
 * 请求实例工厂函数
 * 用于创建一个请求实例
 * @author @Jim
 */
import axios from 'axios';
import qs from 'qs';

// store
import { useUserStore } from '@/store/system/index.store';

// utils
import { refreshManager } from '@/utils/request/refreshManager';
import { requestCancelManager } from '@/utils/request/requestCancelManager';
import { errorCodeParser } from './parser';

// types
import type {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  CreateAxiosDefaults,
  HeadersDefaults,
  RawAxiosRequestHeaders,
} from 'axios';

interface IRequestInstantFactory {
  baseURL: string;
  headers?: RawAxiosRequestHeaders | AxiosHeaders | Partial<HeadersDefaults>;
  interceptors?: {
    requestConf?: RawAxiosRequestHeaders | AxiosHeaders | Partial<HeadersDefaults>;
  };
}

class RequestInstantFactory {
  private readonly _instance: AxiosInstance;

  constructor({ baseURL, headers, interceptors }: IRequestInstantFactory) {
    const axiosInitialConfig: CreateAxiosDefaults = {
      baseURL,
    };
    if (headers) {
      axiosInitialConfig.headers = headers;
    }
    this._instance = axios.create(axiosInitialConfig);

    this._instance.defaults.paramsSerializer = {
      serialize(params) {
        return qs.stringify(params, { arrayFormat: 'brackets' });
      },
    };

    // 请求拦截
    this._instance.interceptors.request.use(
      (config) => {
        // 如果正在批量取消，拒绝新请求
        if (requestCancelManager.isCancellingAll()) {
          return Promise.reject(new Error('Requests are being cancelled'));
        }

        // 创建 AbortController 并注册到取消管理器
        const controller = new AbortController();
        config.signal = controller.signal;
        requestCancelManager.add(config.url || '', controller);

        // 添加 token
        const token = localStorage.getItem('access_token') || '';
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加自定义请求头
        if (interceptors?.requestConf) {
          Object.assign(config.headers, interceptors.requestConf);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 响应拦截
    this._instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 请求成功，从取消管理器中移除
        if (response.config.signal) {
          const controller = response.config.signal as unknown as AbortController;
          requestCancelManager.remove(controller);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalConfig = error.config;

        // 从取消管理器中移除失败的请求
        if (originalConfig?.signal) {
          const controller = originalConfig.signal as unknown as AbortController;
          requestCancelManager.remove(controller);
        }

        // 如果是手动取消的请求，直接拒绝
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }

        // 处理 401 未授权错误
        if (error.response?.status === 401 && originalConfig) {
          // 如果刷新流程已被取消（如用户登出），直接跳转登录
          if (refreshManager.isCancelled()) {
            window.location.href = '/login';
            return Promise.reject(error);
          }

          // 如果正在刷新 token，等待刷新完成后重试
          if (refreshManager.isRefreshing()) {
            try {
              await refreshManager.waitRefresh();
              // 刷新成功，重试原请求
              return this._instance.request(originalConfig);
            } catch {
              // 刷新失败，跳转登录
              window.location.href = '/login';
              return Promise.reject(error);
            }
          }

          // 启动 token 刷新流程
          try {
            await refreshManager.startRefresh(async () => {
              const refreshToken = localStorage.getItem('refresh_token');
              if (!refreshToken) {
                throw new Error('No refresh token available');
              }

              // 调用刷新 token API
              const response = await axios.post(`${this._instance.defaults.baseURL}/auth/refresh`, {
                refresh_token: refreshToken,
              });

              const { access_token, refresh_token } = response.data.data;
              localStorage.setItem('access_token', access_token);
              localStorage.setItem('refresh_token', refresh_token);
            });

            // 刷新成功，重试原请求
            return this._instance.request(originalConfig);
          } catch (refreshError) {
            // 刷新失败，清除 token 并跳转登录
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // 重置用户状态
            useUserStore.getState().reset();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // 其他错误
        console.warn(errorCodeParser(error));
        return Promise.reject(errorCodeParser(error));
      },
    );
  }

  public getInstance() {
    return this._instance;
  }
}

export default RequestInstantFactory;
