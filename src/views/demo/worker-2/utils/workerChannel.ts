import type { WorkerToMainMessage } from '../typing';

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  /** 超时定时器句柄，请求完成后需主动清除以防内存泄漏 */
  timeoutId: ReturnType<typeof setTimeout>;
  onProgress?: (percent: number) => void;
}

interface WorkerChannelOptions {
  initTimeout?: number;
}

/** Worker 初始化握手的默认超时时长 5s */
const DEFAULT_READY_TIMEOUT = 5_000;
/** 单次请求的默认超时时长 6s，超时后 Promise 将以错误拒绝 */
const DEFAULT_TIMEOUT = 60_000;


const WORKER_CHANNEL_ERROR_CODE = {}

/**
 * WorkerChannel — Worker 通信信道
 *
 * 封装与 `worker.ts` 的全部通信细节：
 *  - 初始化握手及超时保护
 *  - 基于自增 id 的请求/响应匹配
 *  - compute 任务的进度回调与软取消
 *  - Worker 错误统一处理与所有挂起请求的批量拒绝
 */
class WorkerChannel {
  /** Worker 实例 */
  private _worker: Worker;
  /** 自增请求 ID */
  private _requestId = 1;
  /** 所有未完成请求的上下文映射表，key 为请求 ID */
  private _pendingRequests = new Map<number, PendingRequest>();
  private _readyResolve: (() => void) | null = null;
  private _readyReject: ((reason?: unknown) => void) | null = null;
  private _readyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  /** 握手完成后 resolve 的 Promise，外部可 await 此字段确保 Worker 就绪后再发请求 */
  public readonly ready: Promise<void>;

  constructor(options: WorkerChannelOptions) {
    const initTimeout = options?.initTimeout ?? DEFAULT_READY_TIMEOUT;

    this._worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
      name: 'demo-worker',
    });

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    this.ready = promise;
    this._readyResolve = resolve;
    this._readyReject = reject;

    this._readyTimeoutId = setTimeout(() => {

    }, initTimeout);
  }

  private _handleMessage(message: WorkerToMainMessage) {}

}

export default WorkerChannel;
