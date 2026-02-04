/**
 * Token 刷新管理器
 *
 * 职责：
 * 1. 确保同时只有一个 refresh 请求在执行
 * 2. 管理等待 refresh 完成的请求队列
 * 3. 支持取消刷新流程（logout 场景）
 * 4. 防止并发请求导致的重复刷新
 *
 * @example
 * ```typescript
 * const refreshManager = new RefreshManager();
 *
 * // 场景1：启动 refresh
 * await refreshManager.startRefresh(async () => {
 *   const res = await api.refreshToken();
 *   await saveToken(res.data);
 * });
 *
 * // 场景2：其他请求等待 refresh 完成
 * if (refreshManager.isRefreshing()) {
 *   await refreshManager.waitRefresh();
 *   // refresh 完成后继续执行
 * }
 *
 * // 场景3：logout 时取消
 * refreshManager.cancel();
 * ```
 */
export class RefreshManager {
  /** 是否正在刷新中 */
  private _refreshing = false;

  /** 是否已取消（logout 时置为 true） */
  private _cancelled = false;

  /** 等待刷新完成的 resolve 回调队列 */
  private _waitResolvers: (() => void)[] = [];

  /** 等待刷新完成的 reject 回调队列 */
  private _waitRejectors: ((err: unknown) => void)[] = [];

  /**
   * 检查是否正在刷新
   */
  isRefreshing(): boolean {
    return this._refreshing;
  }

  /**
   * 检查是否已取消
   */
  isCancelled(): boolean {
    return this._cancelled;
  }

  /**
   * 取消刷新流程
   * 用于 logout 场景，防止 refresh 完成后继续发送 retry 请求
   */
  cancel(): void {
    this._cancelled = true;
    // 清空所有等待队列，拒绝所有挂起的请求
    this._waitRejectors.forEach((fn) => fn(new Error('Refresh cancelled')));
    this._waitResolvers = [];
    this._waitRejectors = [];
  }

  /**
   * 重置取消状态
   * 用于重新登录后恢复正常流程
   */
  reset(): void {
    this._cancelled = false;
  }

  /**
   * 挂起等待 refresh 完成
   * @returns Promise<void> 当 refresh 成功时 resolve，失败时 reject
   */
  waitRefresh(): Promise<void> {
    if (this._cancelled) {
      return Promise.reject(new Error('Refresh cancelled'));
    }
    return new Promise<void>((resolve, reject) => {
      this._waitResolvers.push(resolve);
      this._waitRejectors.push(reject);
    });
  }

  /**
   * 启动 refresh 流程
   * @param task refresh 任务函数
   * @returns Promise 返回 task 的执行结果
   */
  async startRefresh(task: () => Promise<unknown>): Promise<unknown> {
    // 原子性检查：必须在同步代码块内完成判断和赋值，防止竞态条件
    if (this._refreshing) return;
    if (this._cancelled) {
      throw new Error('Refresh cancelled');
    }

    // 立即置位，防止并发请求触发重复 refresh
    this._refreshing = true;

    try {
      const res = await task();

      // refresh 成功后检查是否被取消
      if (this._cancelled) {
        this._refreshing = false;
        this._waitResolvers = [];
        this._waitRejectors = [];
        throw new Error('Refresh cancelled after completion');
      }

      this._refreshing = false;
      this._waitResolvers.forEach((fn) => fn());
      this._waitResolvers = [];
      this._waitRejectors = [];
      return res;
    } catch (err) {
      this._refreshing = false;
      this._waitRejectors.forEach((fn) => fn(err));
      this._waitResolvers = [];
      this._waitRejectors = [];
      throw err;
    }
  }
}

/** 导出单例 */
export const refreshManager = new RefreshManager();
