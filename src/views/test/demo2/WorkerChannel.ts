import type { MainToWorkerMessage, WorkerAction, WorkerToMainMessage } from './types';

// ─── 超时默认值 ────────────────────────────────────────────────────────────────

/** 单次请求的默认超时时长（毫秒），超时后 Promise 将以错误拒绝 */
const DEFAULT_TIMEOUT = 60_000;

/** Worker 初始化握手的默认超时时长（毫秒） */
const DEFAULT_READY_TIMEOUT = 5_000;

// ─── 内部类型 ──────────────────────────────────────────────────────────────────

/** 挂起中的请求上下文，保存 Promise 的 resolve/reject 及相关回调 */
type PendingRequest = {
  resolve: (value: { data: string; duration: number; action: WorkerAction }) => void;
  reject: (reason?: unknown) => void;
  /** 超时定时器句柄，请求完成后需主动清除以防内存泄漏 */
  timeoutId: ReturnType<typeof setTimeout>;
  /** compute 任务的进度回调（0–100），非 compute 任务可不传 */
  onProgress?: (percent: number) => void;
};

/** `request()` 方法的可选配置项 */
type RequestOptions = {
  /** 请求超时时长（毫秒），默认 60s */
  timeout?: number;
  /** compute 任务的模拟时长（毫秒），会透传给 Worker */
  durationMs?: number;
  /** compute 任务的进度回调（0–100） */
  onProgress?: (percent: number) => void;
  /**
   * 同步回调：在 Promise 开始前将本次请求的 id 暴露给调用方，
   * 调用方可凭此 id 在任意时刻调用 `cancel()` 取消任务。
   */
  onRequestId?: (id: number) => void;
};

/** `WorkerChannel` 构造函数的可选配置项 */
type WorkerChannelOptions = {
  /** Worker 初始化握手超时时长（毫秒），默认 5s */
  readyTimeout?: number;
};

// ─── 主类 ──────────────────────────────────────────────────────────────────────

/**
 * WorkerChannel — Worker 通信信道
 *
 * 封装与 `worker.ts` 的全部通信细节：
 *  - 初始化握手及超时保护
 *  - 基于自增 id 的请求/响应匹配
 *  - compute 任务的进度回调与软取消
 *  - Worker 错误统一处理与所有挂起请求的批量拒绝
 *
 * 使用方式：
 * ```ts
 * const channel = new WorkerChannel();
 * await channel.ready;
 * const result = await channel.request('echo', 'hello');
 * channel.terminate();
 * ```
 */
export class WorkerChannel {
  private worker: Worker;
  /** 自增请求 id，用于唯一标识每一次 request/response 的对应关系 */
  private requestId = 1;
  /** 所有未完成请求的上下文映射表，key 为请求 id */
  private pending = new Map<number, PendingRequest>();
  /** ready Promise 的 resolve 函数，握手成功后调用，之后置 null 防止重复触发 */
  private readyResolve: (() => void) | null = null;
  /** ready Promise 的 reject 函数，握手超时或 Worker 出错时调用 */
  private readyReject: ((reason?: unknown) => void) | null = null;
  /** 初始化握手的超时定时器句柄 */
  private readyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** 握手完成后 resolve 的 Promise，外部可 await 此字段确保 Worker 就绪后再发请求 */
  public readonly ready: Promise<void>;

  constructor(options?: WorkerChannelOptions) {
    const readyTimeout = options?.readyTimeout ?? DEFAULT_READY_TIMEOUT;

    this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
      name: 'demo2-worker',
    });

    this.ready = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    // 防止 Worker 始终无响应，超时后主动拒绝 ready
    this.readyTimeoutId = setTimeout(() => {
      this.failReady(new Error(`Worker 初始化超时（>${readyTimeout}ms）`));
    }, readyTimeout);

    this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      this.handleMessage(event.data);
    };

    // Worker 内部抛出未捕获异常时触发
    this.worker.onerror = () => {
      this.rejectAllPending('Worker 运行时错误');
      this.failReady(new Error('Worker 在就绪前发生运行时错误'));
    };

    // Worker 收到无法反序列化的消息时触发（通常为 structured clone 失败）
    this.worker.onmessageerror = () => {
      this.rejectAllPending('Worker 消息解析错误');
      this.failReady(new Error('Worker 在就绪前发生消息解析错误'));
    };

    // 发送初始化握手，Worker 收到后回复 ready
    this.worker.postMessage({ type: 'init' } satisfies MainToWorkerMessage);
  }

  /**
   * 向 Worker 发送一次任务请求
   *
   * @param action  任务类型（echo / uppercase / compute）
   * @param payload 字符串类任务的输入内容，compute 任务传空字符串即可
   * @param options 可选：超时、时长、进度回调、id 回调
   * @returns 包含 `data`、`duration`、`action` 的结果对象
   */
  public request(action: WorkerAction, payload: string, options?: RequestOptions) {
    const id = this.requestId++;
    const { timeout = DEFAULT_TIMEOUT, durationMs, onProgress, onRequestId } = options ?? {};

    // 同步暴露请求 id，调用方可在 Promise 完成前随时取消
    onRequestId?.(id);

    return new Promise<{ data: string; duration: number; action: WorkerAction }>(
      (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(`请求超时（>${timeout}ms）`));
        }, timeout);

        this.pending.set(id, { resolve, reject, timeoutId, onProgress });

        this.worker.postMessage({
          type: 'request',
          id,
          action,
          payload,
          sentAt: Date.now(),
          durationMs,
        } satisfies MainToWorkerMessage);
      },
    );
  }

  /**
   * 取消一个正在运行的 compute 任务
   *
   * 立即拒绝对应的 Promise，并通知 Worker 执行软取消（下一切片检查点生效）。
   * 若该 id 对应的任务不存在或已完成，调用此方法无任何副作用。
   *
   * @param id Worker 请求 id（由 `onRequestId` 回调获取）
   */
  public cancel(id: number) {
    const pending = this.pending.get(id);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    this.pending.delete(id);
    pending.reject(new Error('任务已取消'));

    this.worker.postMessage({ type: 'cancel', id } satisfies MainToWorkerMessage);
  }

  /**
   * 终止 Worker 线程并拒绝所有挂起中的请求
   *
   * 调用后此 `WorkerChannel` 实例不可再用，应丢弃引用。
   */
  public terminate() {
    this.clearReadyTimeout();
    this.failReady(new Error('Worker 已被主线程终止'));
    this.rejectAllPending('Worker 已被主线程终止');
    this.worker.terminate();
  }

  /** 处理来自 Worker 的消息，按 type 分发到对应逻辑 */
  private handleMessage(message: WorkerToMainMessage) {
    if (message.type === 'ready') {
      this.clearReadyTimeout();
      this.readyResolve?.();
      // 清除引用，防止握手信号被重复触发
      this.readyResolve = null;
      this.readyReject = null;
      return;
    }

    if (message.type === 'progress') {
      // 将进度透传给调用方注册的回调，不影响 Promise 状态
      this.pending.get(message.id)?.onProgress?.(message.percent);
      return;
    }

    // 处理 response：取出挂起项，结算 Promise
    const pendingItem = this.pending.get(message.id);
    if (!pendingItem) return;

    clearTimeout(pendingItem.timeoutId);
    this.pending.delete(message.id);

    if (!message.ok) {
      pendingItem.reject(new Error(message.error ?? '未知 Worker 错误'));
      return;
    }

    pendingItem.resolve({
      action: message.action,
      duration: message.duration,
      data: message.data ?? '',
    });
  }

  /** 批量拒绝所有挂起中的请求，通常在 Worker 异常终止时调用 */
  private rejectAllPending(reason: string) {
    for (const [, item] of this.pending) {
      clearTimeout(item.timeoutId);
      item.reject(new Error(reason));
    }
    this.pending.clear();
  }

  /** 拒绝 ready Promise，并清除超时定时器与相关引用 */
  private failReady(reason: Error) {
    this.clearReadyTimeout();
    if (!this.readyReject) return;
    this.readyReject(reason);
    this.readyReject = null;
    this.readyResolve = null;
  }

  /** 清除握手超时定时器，防止重复触发 */
  private clearReadyTimeout() {
    if (!this.readyTimeoutId) return;
    clearTimeout(this.readyTimeoutId);
    this.readyTimeoutId = null;
  }
}
