# HTTP 请求封装使用指南

本项目的 HTTP 请求封装已集成**请求取消管理**和 **Token 自动刷新**机制，提供健壮、优雅的 API 调用体验。

## ✨ 核心特性

### 1. 自动 Token 刷新

- 当接口返回 401 时，自动使用 refresh_token 刷新 access_token
- 刷新期间的所有请求会排队等待，刷新完成后自动重试
- 刷新失败自动跳转登录页
- 防止并发请求导致的重复刷新

### 2. 请求取消管理

- 统一管理所有进行中的请求
- 支持一键取消所有请求（路由切换、用户登出等场景）
- 批量取消期间自动拒绝新请求

### 3. 错误处理

- 统一的错误码解析
- 取消请求的友好提示
- 完善的日志记录

---

## 📖 基本使用

### 发起普通请求

```typescript
import request from '@/services/http';

// GET 请求
const user = await request<User>('/api/user/123', {
  method: 'GET',
});

// POST 请求
const result = await request<CreateUserResponse>('/api/user', {
  method: 'POST',
  data: { name: 'Alice', email: 'alice@example.com' },
});

// PUT 请求
await request('/api/user/123', {
  method: 'PUT',
  data: { name: 'Bob' },
});

// DELETE 请求
await request('/api/user/123', {
  method: 'DELETE',
});
```

### 带响应头的请求

```typescript
import { requestWidthHeaders } from '@/services/http';

const { data, headers } = await requestWidthHeaders<User>('/api/user', {
  method: 'GET',
});

console.log('Total:', headers['x-total-count']);
```

---

## 🔐 Token 管理

### 登录流程

```typescript
import { login } from '@/services/api/auth';

const handleLogin = async () => {
  try {
    const result = await login({
      username: 'admin',
      password: '123456',
    });

    // 保存 token
    localStorage.setItem('access_token', result.access_token);
    localStorage.setItem('refresh_token', result.refresh_token);

    // 跳转首页
    navigate('/home');
  } catch (error) {
    console.error('登录失败:', error);
  }
};
```

### 登出流程

```typescript
import { logout } from '@/services/api/auth';
import { requestCancelManager, refreshManager } from '@/services/http';

const handleLogout = async () => {
  try {
    // 1. 取消所有进行中的请求
    requestCancelManager.cancelAll('用户登出');

    // 2. 取消 token 刷新流程
    refreshManager.cancel();

    // 3. 调用登出接口
    await logout();

    // 4. 清除本地 token
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // 5. 跳转登录页
    window.location.href = '/login';
  } catch (error) {
    console.error('登出失败:', error);
  }
};
```

### Token 自动刷新（无需手动处理）

当任何请求返回 401 时，系统会自动：

1. 检查是否已在刷新中
2. 如果是，等待刷新完成后重试
3. 如果不是，启动刷新流程
4. 刷新成功后自动重试原请求
5. 刷新失败则跳转登录页

```typescript
// 示例：这个请求如果返回 401，会自动刷新 token 并重试
const fetchUserInfo = async () => {
  try {
    const user = await request<User>('/api/user/me');
    return user;
  } catch (error) {
    // 只有刷新失败才会到这里
    console.error('获取用户信息失败:', error);
  }
};
```

---

## 🚫 请求取消管理

### 路由切换时取消请求

```typescript
// 在路由守卫或布局组件中
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { requestCancelManager } from '@/services/http';

const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    // 路由变化时取消所有请求
    return () => {
      requestCancelManager.cancelAll('路由切换');
    };
  }, [location.pathname]);

  return <Outlet />;
};
```

### 组件卸载时取消请求

```typescript
import { useEffect } from 'react';
import { requestCancelManager } from '@/services/http';

const MyComponent = () => {
  useEffect(() => {
    // 组件卸载时取消请求
    return () => {
      requestCancelManager.cancelAll('组件卸载');
    };
  }, []);

  return <div>...</div>;
};
```

### 查看待处理的请求

```typescript
import { requestCancelManager } from '@/services/http';

// 获取待处理请求数量
const count = requestCancelManager.getPendingCount();
console.log(`当前有 ${count} 个请求正在处理`);

// 获取所有待处理请求的 URL
const urls = requestCancelManager.getPendingUrls();
console.log('待处理的请求:', urls);
```

---

## 🔧 高级用法

### 自定义请求拦截器

```typescript
// 在创建实例时传入自定义请求头
import RequestInstantFactory from '@/services/http/request';

const customInstance = new RequestInstantFactory({
  baseURL: 'https://api.example.com',
  interceptors: {
    requestConf: {
      'X-Custom-Header': 'value',
      'X-App-Version': '1.0.0',
    },
  },
}).getInstance();
```

### 手动刷新 Token

```typescript
import { refreshManager } from '@/services/http';

const manualRefresh = async () => {
  try {
    await refreshManager.startRefresh(async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post('/auth/refresh', {
        refresh_token: refreshToken,
      });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    });

    console.log('Token 刷新成功');
  } catch (error) {
    console.error('Token 刷新失败:', error);
  }
};
```

### 检查刷新状态

```typescript
import { refreshManager } from '@/services/http';

// 是否正在刷新
if (refreshManager.isRefreshing()) {
  console.log('正在刷新 token...');
}

// 是否已取消
if (refreshManager.isCancelled()) {
  console.log('刷新流程已取消');
}
```

---

## 🎯 最佳实践

### 1. 统一的错误处理

```typescript
// 在顶层组件或 hook 中统一处理
const useApi = <T>(apiCall: () => Promise<T>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err as Error);
      // 统一错误提示
      toast.error('操作失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
};

// 使用
const { execute, loading } = useApi(() => request('/api/users'));
```

### 2. React Query 集成

```typescript
import { useQuery } from '@tanstack/react-query';
import request from '@/services/http';

const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => request<User>(`/api/user/${userId}`),
    // React Query 会自动处理取消
    // 请求取消管理器会在组件卸载时清理
  });
};
```

### 3. 条件请求

```typescript
// 登录后才发起请求
const fetchProtectedData = async () => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    console.warn('用户未登录');
    return;
  }

  try {
    const data = await request<ProtectedData>('/api/protected');
    return data;
  } catch (error) {
    // 会自动刷新 token 并重试
    console.error('请求失败:', error);
  }
};
```

---

## ⚠️ 注意事项

1. **Token 存储**：目前使用 `localStorage` 存储 token，生产环境建议使用更安全的方式（如 httpOnly cookie）

2. **刷新接口**：需要后端提供 `/auth/refresh` 接口，返回格式：

   ```json
   {
     "data": {
       "access_token": "new_access_token",
       "refresh_token": "new_refresh_token",
       "expires_in": 3600
     }
   }
   ```

3. **并发处理**：系统已处理并发 401 场景，无需担心重复刷新

4. **取消时机**：在路由切换、组件卸载、用户登出时记得调用 `cancelAll`

5. **错误边界**：建议在应用顶层添加错误边界组件，捕获未处理的请求错误

---

## 📝 API 参考

### `request<T>(url, config)`

- **参数**：
  - `url: string` - 请求地址
  - `config?: AxiosRequestConfig` - axios 配置
- **返回**：`Promise<T>` - 响应数据
- **特性**：自动 token 刷新、自动取消管理

### `requestWidthHeaders<T>(url, config)`

- **参数**：同 `request`
- **返回**：`Promise<{ data: T, headers: any }>` - 响应数据和响应头

### `requestCancelManager`

- `add(url, controller)` - 添加请求到管理器
- `remove(controller)` - 移除已完成的请求
- `cancelAll(reason?)` - 取消所有请求
- `isCancellingAll()` - 是否正在批量取消
- `getPendingCount()` - 获取待处理请求数量
- `getPendingUrls()` - 获取待处理请求 URL 列表

### `refreshManager`

- `isRefreshing()` - 是否正在刷新
- `isCancelled()` - 是否已取消
- `cancel()` - 取消刷新流程
- `reset()` - 重置取消状态
- `waitRefresh()` - 等待刷新完成
- `startRefresh(task)` - 启动刷新流程

---

## 🚀 迁移指南

如果你的项目已有请求封装，迁移步骤：

1. **更新导入**：

   ```typescript
   // 旧的
   import request from '@/utils/request';

   // 新的
   import request from '@/services/http';
   ```

2. **移除手动取消逻辑**：

   ```typescript
   // 旧的 - 需要手动管理 CancelToken
   const source = axios.CancelToken.source();
   useEffect(() => {
     return () => source.cancel();
   }, []);

   // 新的 - 自动管理，无需手动处理
   useEffect(() => {
     fetchData();
   }, []);
   ```

3. **更新登出逻辑**：

   ```typescript
   // 旧的
   const logout = () => {
     localStorage.clear();
     window.location.href = '/login';
   };

   // 新的
   import { requestCancelManager, refreshManager } from '@/services/http';

   const logout = () => {
     requestCancelManager.cancelAll('用户登出');
     refreshManager.cancel();
     localStorage.clear();
     window.location.href = '/login';
   };
   ```

---

## 🐛 故障排查

### 问题：401 后一直重定向到登录页

**原因**：refresh_token 无效或过期 **解决**：检查 refresh_token 是否正确存储，或让用户重新登录

### 问题：请求被意外取消

**原因**：组件卸载或路由切换时触发了 cancelAll **解决**：确保取消逻辑只在必要时触发，避免过度使用 cancelAll

### 问题：Token 刷新失败

**原因**：后端接口返回格式不匹配 **解决**：检查后端 `/auth/refresh` 接口返回格式是否符合预期

### 问题：并发请求导致多次刷新

**原因**：refreshManager 已处理，不应该出现 **解决**：检查是否有多个请求实例，确保使用单例

---

## 📚 相关文档

- [Axios 文档](https://axios-http.com/)
- [AbortController MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
- [React Query 文档](https://tanstack.com/query/latest)

---

**最后更新**：2026-02-04 **维护者**：@pureJim
