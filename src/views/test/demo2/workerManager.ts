import type { MainToWorkerMessage, WorkerAction, WorkerToMainMessage } from './types';

// 每个 pending 请求在主线程中的状态
type PendingRequest = {
  resolve: (value: { data: string; duration: number; action: WorkerAction }) => void;
  reject: (reason?: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

// 请求默认超时时间，单位毫秒
const DEFAULT_TIMEOUT = 10_000;

export class Demo2WorkerManager {
  // 单个 manager 维护一个 worker 实例
  private worker: Worker;

  // 自增请求 id，用于 request/response 对应
  private requestId = 1;

  // 用于把回包 id 映射到 Promise 的 resolve/reject
  private pending = new Map<number, PendingRequest>();

  private readyResolve: (() => void) | null = null;

  private readyReject: ((reason?: unknown) => void) | null = null;

  public readonly ready: Promise<void>;

  constructor() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
      name: 'demo2-worker',
    });

    // 构造一个 ready Promise，供外部 await 初始化完成
    this.ready = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      this.handleMessage(event.data);
    };

    // worker 运行时错误：拒绝所有挂起请求
    this.worker.onerror = () => {
      this.rejectAllPending('worker runtime error');
      this.readyReject?.(new Error('worker runtime error before ready'));
      this.readyReject = null;
      this.readyResolve = null;
    };

    // 消息解析失败：同样拒绝所有挂起请求
    this.worker.onmessageerror = () => {
      this.rejectAllPending('worker message parsing failed');
    };

    // 启动后先做一次握手
    const initMessage: MainToWorkerMessage = { kind: 'init' };
    this.worker.postMessage(initMessage);
  }

  // Promise 化请求入口：发送 request 并等待 response
  public request(action: WorkerAction, payload: string, timeout = DEFAULT_TIMEOUT) {
    const id = this.requestId++;

    return new Promise<{ data: string; duration: number; action: WorkerAction }>(
      (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(`request timeout after ${timeout}ms`));
        }, timeout);

        this.pending.set(id, {
          resolve,
          reject,
          timeoutId,
        });

        const message: MainToWorkerMessage = {
          kind: 'request',
          id,
          action,
          payload,
          sentAt: Date.now(),
        };

        this.worker.postMessage(message);
      },
    );
  }

  // 主线程主动终止 worker
  public terminate() {
    this.rejectAllPending('worker terminated by main thread');
    this.worker.terminate();
  }

  // 统一处理 worker 回包
  private handleMessage(message: WorkerToMainMessage) {
    // ready 回包只用于初始化状态
    if (message.kind === 'ready') {
      this.readyResolve?.();
      this.readyResolve = null;
      this.readyReject = null;
      return;
    }

    const pendingItem = this.pending.get(message.id);

    if (!pendingItem) {
      return;
    }

    clearTimeout(pendingItem.timeoutId);
    this.pending.delete(message.id);

    // 失败回包走 reject，成功回包走 resolve
    if (!message.ok) {
      pendingItem.reject(new Error(message.error ?? 'unknown worker error'));
      return;
    }

    pendingItem.resolve({
      action: message.action,
      duration: message.duration,
      data: message.data ?? '',
    });
  }

  // 终止或异常时统一清理挂起请求
  private rejectAllPending(reason: string) {
    for (const [, pendingItem] of this.pending) {
      clearTimeout(pendingItem.timeoutId);
      pendingItem.reject(new Error(reason));
    }
    this.pending.clear();
  }
}
