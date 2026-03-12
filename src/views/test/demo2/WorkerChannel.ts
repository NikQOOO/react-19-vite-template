import type { MainToWorkerMessage, WorkerAction, WorkerToMainMessage } from './types';

const DEFAULT_TIMEOUT = 60_000;
const DEFAULT_READY_TIMEOUT = 5_000;

// ─── Error ──────────────────────────────────────────────────────────────────────

export const ErrorCode = {
  TERMINATED: 'TERMINATED',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
  SEND_FAILED: 'SEND_FAILED',
  READY_FAILED: 'READY_FAILED',
  WORKER_FAILED: 'WORKER_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class WorkerChannelError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, detail?: string) {
    super(detail ?? code);
    this.name = 'WorkerChannelError';
    this.code = code;
  }
}

export const isWorkerChannelError = (e: unknown): e is WorkerChannelError =>
  e instanceof WorkerChannelError;

// ─── Public Types ───────────────────────────────────────────────────────────────

export type RequestResult = { data: string; duration: number; action: WorkerAction };

export type RequestOptions = {
  timeout?: number;
  onProgress?: (percent: number) => void;
  onRequestId?: (id: number) => void;
};

// ─── Internal Types ─────────────────────────────────────────────────────────────

type Pending = {
  resolve: (v: RequestResult) => void;
  reject: (e: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
  onProgress?: (percent: number) => void;
};

// ─── WorkerChannel ──────────────────────────────────────────────────────────────

export class WorkerChannel {
  private worker: Worker;
  private dead = false;
  private seq = 1;
  private pending = new Map<number, Pending>();
  private readyTimer: ReturnType<typeof setTimeout> | null = null;
  private readyFns: { resolve: () => void; reject: (e: unknown) => void };

  readonly ready: Promise<void>;

  constructor(url: URL, opts?: { readyTimeout?: number }) {
    const readyMs = opts?.readyTimeout ?? DEFAULT_READY_TIMEOUT;

    this.worker = new Worker(url, { type: 'module' });

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    this.ready = promise;
    this.readyFns = { resolve, reject };

    this.readyTimer = setTimeout(
      () => this.settleReady(this.err(ErrorCode.READY_FAILED, `ready timeout >${readyMs}ms`)),
      readyMs,
    );

    this.worker.onmessage = ({ data }: MessageEvent<WorkerToMainMessage>) => this.onMsg(data);
    this.worker.onerror = () => this.onFatal('worker runtime error');
    this.worker.onmessageerror = () => this.onFatal('message deserialization failed');
  }

  request(action: WorkerAction, payload: string, opts?: RequestOptions): Promise<RequestResult> {
    if (this.dead) return Promise.reject(this.err(ErrorCode.TERMINATED));

    const id = this.seq++;
    const { timeout = DEFAULT_TIMEOUT, onProgress, onRequestId } = opts ?? {};

    const { promise, resolve, reject } = Promise.withResolvers<RequestResult>();

    const timer = setTimeout(() => {
      this.pending.delete(id);
      reject(this.err(ErrorCode.TIMEOUT, `timeout >${timeout}ms`));
    }, timeout);

    this.pending.set(id, { resolve, reject, timer, onProgress });

    try {
      onRequestId?.(id);
      this.send({ type: 'request', id, action, payload, sentAt: Date.now() });
    } catch (e) {
      this.evict(id, this.err(ErrorCode.SEND_FAILED, e instanceof Error ? e.message : undefined));
    }

    return promise;
  }

  cancel(id: number) {
    if (!this.pending.has(id)) return;
    this.evict(id, this.err(ErrorCode.CANCELLED));
    this.send({ type: 'cancel', id });
  }

  terminate() {
    if (this.dead) return;
    this.dead = true;

    this.settleReady(this.err(ErrorCode.TERMINATED));
    for (const id of [...this.pending.keys()]) this.evict(id, this.err(ErrorCode.TERMINATED));

    this.worker.onmessage = this.worker.onerror = this.worker.onmessageerror = null;
    this.worker.terminate();
  }

  // ─── Internals ────────────────────────────────────────────────────────────────

  private onMsg(msg: WorkerToMainMessage) {
    if (msg.type === 'ready') return this.settleReady();
    if (msg.type === 'progress') return void this.pending.get(msg.id)?.onProgress?.(msg.percent);

    const p = this.pending.get(msg.id);
    if (!p) return;

    if (!msg.ok) return this.evict(msg.id, this.err(ErrorCode.WORKER_FAILED, msg.error));

    clearTimeout(p.timer);
    this.pending.delete(msg.id);
    p.resolve({ action: msg.action, duration: msg.duration, data: msg.data });
  }

  private evict(id: number, error: WorkerChannelError) {
    const p = this.pending.get(id);
    if (!p) return;
    clearTimeout(p.timer);
    this.pending.delete(id);
    p.reject(error);
  }

  private settleReady(error?: WorkerChannelError) {
    if (this.readyTimer) {
      clearTimeout(this.readyTimer);
      this.readyTimer = null;
    }
    if (error) {
      this.readyFns.reject(error);
    } else {
      this.readyFns.resolve();
    }
    this.readyFns = { resolve: () => {}, reject: () => {} };
  }

  private onFatal(detail: string) {
    for (const id of [...this.pending.keys()]) {
      this.evict(id, this.err(ErrorCode.WORKER_FAILED, detail));
    }
    this.settleReady(this.err(ErrorCode.READY_FAILED, detail));
  }

  private send(msg: MainToWorkerMessage) {
    this.worker.postMessage(msg);
  }

  private err(code: ErrorCode, detail?: string) {
    return new WorkerChannelError(code, detail);
  }
}
