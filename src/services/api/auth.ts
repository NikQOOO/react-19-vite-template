/**
 * 认证相关 API
 */
import request from '../http';

/**
 * 刷新 token 的响应类型
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * 刷新 token 请求参数
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应类型
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

/**
 * 刷新 access token
 *
 * @param refreshToken - 刷新令牌
 * @returns 新的 token 信息
 *
 * @example
 * const tokens = await refreshAccessToken(refreshToken);
 * localStorage.setItem('access_token', tokens.access_token);
 */
export const refreshAccessToken = async (refreshToken: string) => {
  return request<RefreshTokenResponse>('/auth/refresh', {
    method: 'POST',
    data: { refresh_token: refreshToken },
  });
};

/**
 * 用户登录
 *
 * @param data - 登录信息
 * @returns 登录响应，包含 token 和用户信息
 *
 * @example
 * const result = await login({ username: 'admin', password: '123456' });
 * localStorage.setItem('access_token', result.access_token);
 */
export const login = async (data: LoginRequest) => {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    data,
  });
};

/**
 * 用户登出
 *
 * @example
 * await logout();
 * localStorage.removeItem('access_token');
 */
export const logout = async () => {
  return request<void>('/auth/logout', {
    method: 'POST',
  });
};
