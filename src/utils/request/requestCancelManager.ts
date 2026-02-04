/**
 * 请求取消管理器
 * 用于管理和取消所有pending中的请求
 *
 * 使用场景:
 * - 页面切换时取消所有未完成的请求
 * - 用户登出时清理所有进行中的请求
 * - 避免内存泄漏和无效的网络请求
 */

/**
 * 待处理的请求信息
 */
interface PendingRequest {
  /** 请求的 URL */
  url: string;
  /** AbortController 实例,用于取消请求 */
  controller: AbortController;
}

/**
 * 请求取消管理器类
 * 单例模式,全局统一管理所有 HTTP 请求的取消操作
 */
class RequestCancelManager {
  /** 待处理的请求集合 */
  private _pending = new Set<PendingRequest>();

  /** 是否正在执行批量取消操作的标志位 */
  private _isCancelling = false;

  /**
   * 添加一个待处理的请求到管理器
   *
   * @param url - 请求的 URL 地址
   * @param controller - 请求对应的 AbortController 实例
   *
   * @example
   * const controller = new AbortController();
   * requestCancelManager.add('/api/users', controller);
   */
  add(url: string, controller: AbortController) {
    // 如果正在执行批量取消,立即中止新添加的请求
    if (this._isCancelling) {
      controller.abort();
      return;
    }
    this._pending.add({ url, controller });
  }

  /**
   * 从管理器中移除指定的请求
   * 通常在请求成功完成或失败后调用
   *
   * @param controller - 要移除的请求的 AbortController 实例
   *
   * @example
   * requestCancelManager.remove(controller);
   */
  remove(controller: AbortController) {
    for (const item of this._pending) {
      if (item.controller === controller) {
        this._pending.delete(item);
        break;
      }
    }
  }

  /**
   * 取消所有待处理的请求
   *
   * @param reason - 取消原因,用于日志记录和调试
   *
   * @example
   * // 路由切换时取消所有请求
   * requestCancelManager.cancelAll('路由切换');
   *
   * // 用户登出时取消所有请求
   * requestCancelManager.cancelAll('用户登出');
   */
  cancelAll(reason?: string) {
    // 设置取消标志,防止在取消过程中添加新请求
    this._isCancelling = true;

    // 遍历所有待处理的请求并中止它们
    for (const item of this._pending) {
      item.controller.abort();
    }

    const count = this._pending.size;
    this._pending.clear();
    console.log(`❎ ${count} requests have been cancelled: ${reason || ''}`);

    // 使用 Promise.resolve() 确保在当前事件循环结束后才解除取消状态
    // 避免 cancelAll 后立即发起的请求被错误拦截
    Promise.resolve().then(() => {
      this._isCancelling = false;
    });
  }

  /**
   * 检查当前是否正在执行批量取消操作
   *
   * @returns 如果正在执行批量取消返回 true,否则返回 false
   *
   * @example
   * if (requestCancelManager._isCancellingAll()) {
   *   console.log('正在取消所有请求...');
   * }
   */
  isCancellingAll() {
    return this._isCancelling;
  }

  /**
   * 获取当前待处理的请求数量
   *
   * @returns 待处理请求的数量
   *
   * @example
   * const count = requestCancelManager.getPendingCount();
   * console.log(`当前有 ${count} 个请求正在处理`);
   */
  getPendingCount() {
    return this._pending.size;
  }

  /**
   * 获取所有待处理请求的 URL 列表
   * 用于调试和日志记录
   *
   * @returns URL 字符串数组
   *
   * @example
   * const urls = requestCancelManager.getPendingUrls();
   * console.log('待处理的请求:', urls);
   */
  getPendingUrls() {
    return Array.from(this._pending).map((req) => req.url);
  }
}

export const requestCancelManager = new RequestCancelManager();
