import type { MainToWorkerMessage, TransferMode, WorkerToMainMessage } from './types';

// ─── 超时默认值 ────────────────────────────────────────────────────────────────

/** 单次请求的默认超时时长（毫秒） */
const DEFAULT_TIMEOUT = 30_000;

/** Worker 初始化握手的默认超时时长（毫秒） */
const DEFAULT_READY_TIMEOUT = 5_000;

// ─── 错误处理 ──────────────────────────────────────────────────────────────────

export const TRANSFER_CHANNEL_ERROR_CODE = {
  CHANNEL_TERMINATED: 'CHANNEL_TERMINATED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  READY_FAILED: 'READY_FAILED',
  WORKER_FAILED: 'WORKER_FAILED',
  SEND_FAILED: 'SEND_FAILED',
} as const;

export type TransferChannelErrorCode =
  (typeof TRANSFER_CHANNEL_ERROR_CODE)[keyof typeof TRANSFER_CHANNEL_ERROR_CODE];

export class TransferChannelError extends Error {
  public readonly code: TransferChannelErrorCode;

  constructor(code: TransferChannelErrorCode, message: string) {
    super(message);
    this.name = 'TransferChannelError';
    this.code = code;
  }
}

const DEFAULT_ERROR_MESSAGE: Record<TransferChannelErrorCode, string> = {
  CHANNEL_TERMINATED: 'TransferChannel 已终止',
  REQUEST_TIMEOUT: '请求超时',
  READY_FAILED: 'Worker 初始化失败',
  WORKER_FAILED: 'Worker 执行失败',
  SEND_FAILED: '消息发送失败',
};

const createError = (code: TransferChannelErrorCode, detail?: string) =>
  new TransferChannelError(code, detail ?? DEFAULT_ERROR_MESSAGE[code]);

// ─── 内部类型 ──────────────────────────────────────────────────────────────────

/** 一次 process 请求的完整结果 */
export type ProcessResult = {
  /** Worker 计算的校验和（Uint8 字节累加，截断为 u32） */
  checksum: number;
  /** Worker 实际收到的 buffer 字节数 */
  byteLength: number;
  /** Worker 侧计算耗时（ms） */
  processTime: number;
  /** 主线程 postMessage 到收到结果的往返耗时（ms） */
  roundTrip: number;
  /** 使用的传输模式 */
  mode: TransferMode;
  /**
   * 发送后主线程侧 buffer 的 byteLength：
   *  - clone 模式：保持原值（数据仍可用）
   *  - transfer 模式：变为 0（所有权已转移，ArrayBuffer 已 detached）
   */
  bufferAfterSend: number;
};

/** 挂起中的请求上下文 */
type PendingRequest = {
  resolve: (value: ProcessResult) => void;
  reject: (reason?: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  mode: TransferMode;
  sentAt: number;
  /** 引用发送时的 buffer，用于检测 detached 状态 */
  bufferRef: ArrayBuffer;
};

type TransferChannelOptions = {
  readyTimeout?: number;
};

// ─── 主类 ──────────────────────────────────────────────────────────────────────

/**
 * TransferChannel — 支持 Transferable Objects 的 Worker 通信信道
 *
 * 在 Demo2 WorkerChannel 的基础上，专注演示两种数据传输方式的差异：
 *  - **Structured Clone**：`postMessage(msg)` — 浏览器序列化 → 复制 → 反序列化
 *  - **Transferable**：`postMessage(msg, [buffer])` — 零拷贝转移所有权
 *
 * 调用方通过 `send()` 方法的 `mode` 参数选择传输方式，
 * Worker 端无需感知差异，收到的 ArrayBuffer 行为完全一致。
 */
export class TransferChannel {
  private _worker: Worker;
  private _isTerminated = false;
  private _requestId = 1;
  private _pending = new Map<number, PendingRequest>();

  private _readyResolve: (() => void) | null = null;
  private _readyReject: ((reason?: unknown) => void) | null = null;
  private _readyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  public readonly ready: Promise<void>;

  constructor(options?: TransferChannelOptions) {
    const readyTimeout = options?.readyTimeout ?? DEFAULT_READY_TIMEOUT;

    this._worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
      name: 'demo3-transfer-worker',
    });

    this.ready = new Promise<void>((resolve, reject) => {
      this._readyResolve = resolve;
      this._readyReject = reject;
    });

    this._readyTimeoutId = setTimeout(() => {
      this._settleReady(
        'reject',
        createError(
          TRANSFER_CHANNEL_ERROR_CODE.READY_FAILED,
          `Worker 初始化超时（>${readyTimeout}ms）`,
        ),
      );
    }, readyTimeout);

    this._worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      this._handleMessage(event.data);
    };

    this._worker.onerror = () => {
      if (this._isTerminated) return;
      this._rejectAllPending(TRANSFER_CHANNEL_ERROR_CODE.WORKER_FAILED, 'Worker 运行时错误');
      this._settleReady(
        'reject',
        createError(TRANSFER_CHANNEL_ERROR_CODE.READY_FAILED, 'Worker 在就绪前发生运行时错误'),
      );
    };

    this._worker.onmessageerror = () => {
      if (this._isTerminated) return;
      this._rejectAllPending(TRANSFER_CHANNEL_ERROR_CODE.WORKER_FAILED, 'Worker 消息解析错误');
      this._settleReady(
        'reject',
        createError(TRANSFER_CHANNEL_ERROR_CODE.READY_FAILED, 'Worker 在就绪前发生消息解析错误'),
      );
    };

    this._worker.postMessage({ type: 'init' } satisfies MainToWorkerMessage);
  }

  /**
   * 向 Worker 发送一个 ArrayBuffer 并等待处理结果
   *
   * @param buffer  要发送的 ArrayBuffer
   * @param mode    传输模式：'clone'（结构化克隆）或 'transfer'（零拷贝转移）
   * @param timeout 超时时长（毫秒），默认 30s
   *
   * @example
   * // 结构化克隆 —— 发送后 buffer 仍可用
   * const result = await channel.send(buffer, 'clone');
   * console.log(buffer.byteLength); // 仍为原始大小
   *
   * @example
   * // Transferable —— 发送后 buffer 被 detach
   * const result = await channel.send(buffer, 'transfer');
   * console.log(buffer.byteLength); // 0（已转移）
   */
  public send(
    buffer: ArrayBuffer,
    mode: TransferMode,
    timeout = DEFAULT_TIMEOUT,
  ): Promise<ProcessResult> {
    if (this._isTerminated) {
      return Promise.reject(createError(TRANSFER_CHANNEL_ERROR_CODE.CHANNEL_TERMINATED));
    }

    const id = this._requestId++;

    return new Promise<ProcessResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this._pending.delete(id);
        reject(
          createError(TRANSFER_CHANNEL_ERROR_CODE.REQUEST_TIMEOUT, `请求超时（>${timeout}ms）`),
        );
      }, timeout);

      this._pending.set(id, {
        resolve,
        reject,
        timeoutId,
        mode,
        sentAt: performance.now(),
        bufferRef: buffer,
      });

      try {
        const message: MainToWorkerMessage = { type: 'process', id, buffer };

        if (mode === 'transfer') {
          // ⭐ 核心差异：第二参数传入 transfer list
          // postMessage 后 buffer 的所有权转移给 Worker，
          // 主线程侧 buffer.byteLength 立即变为 0（detached）。
          this._worker.postMessage(message, [buffer]);
        } else {
          // 结构化克隆：浏览器完整复制一份数据给 Worker，
          // 主线程侧 buffer 不受影响，仍可继续使用。
          this._worker.postMessage(message);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        this._pending.delete(id);
        reject(
          error instanceof Error
            ? createError(TRANSFER_CHANNEL_ERROR_CODE.SEND_FAILED, error.message || undefined)
            : createError(TRANSFER_CHANNEL_ERROR_CODE.SEND_FAILED),
        );
      }
    });
  }

  /** 终止 Worker 线程并拒绝所有挂起中的请求 */
  public terminate() {
    if (this._isTerminated) return;
    this._isTerminated = true;

    this._settleReady(
      'reject',
      createError(TRANSFER_CHANNEL_ERROR_CODE.CHANNEL_TERMINATED, 'Worker 已被主线程终止'),
    );
    this._rejectAllPending(TRANSFER_CHANNEL_ERROR_CODE.CHANNEL_TERMINATED, 'Worker 已被主线程终止');

    this._worker.onmessage = null;
    this._worker.onerror = null;
    this._worker.onmessageerror = null;
    this._worker.terminate();
  }

  private _handleMessage(msg: WorkerToMainMessage) {
    if (this._isTerminated) return;

    if (msg.type === 'ready') {
      this._settleReady('resolve');
      return;
    }

    const pending = this._pending.get(msg.id);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    this._pending.delete(msg.id);

    pending.resolve({
      checksum: msg.checksum,
      byteLength: msg.byteLength,
      processTime: msg.processTime,
      roundTrip: performance.now() - pending.sentAt,
      mode: pending.mode,
      bufferAfterSend: pending.bufferRef.byteLength,
    });
  }

  private _rejectAllPending(code: TransferChannelErrorCode, message: string) {
    for (const [, item] of this._pending) {
      clearTimeout(item.timeoutId);
      item.reject(createError(code, message));
    }
    this._pending.clear();
  }

  private _settleReady(status: 'resolve' | 'reject', reason?: TransferChannelError) {
    if (this._readyTimeoutId) {
      clearTimeout(this._readyTimeoutId);
      this._readyTimeoutId = null;
    }
    if (status === 'resolve') {
      this._readyResolve?.();
    } else {
      this._readyReject?.(reason ?? createError(TRANSFER_CHANNEL_ERROR_CODE.READY_FAILED));
    }
    this._readyReject = null;
    this._readyResolve = null;
  }
}
