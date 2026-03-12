import type { MainToWorkerMessage, WorkerToMainMessage } from './types';

const post = (msg: WorkerToMainMessage) => self.postMessage(msg);

// ─── Cancellation registry ──────────────────────────────────────────────────────

const alive = new Set<number>();

// ─── Instant handlers ───────────────────────────────────────────────────────────

const instant: Record<string, (p: string) => string> = {
  echo: (p) => p,
  uppercase: (p) => p.toUpperCase(),
};

// ─── Scheduler yield ────────────────────────────────────────────────────────────

type Scheduler = {
  postTask(cb: () => void, opts?: { priority?: string }): Promise<void>;
};

const yieldSlice = (): Promise<void> => {
  const s = (globalThis as unknown as { scheduler?: Scheduler }).scheduler;
  return s?.postTask
    ? s.postTask(() => {}, { priority: 'background' })
    : new Promise((r) => setTimeout(r, 0));
};

// ─── Sliceable compute（可切片 · 支持进度上报 & 软取消） ─────────────────────────

async function sliceableCompute(id: number): Promise<string | null> {
  const SLICE_MS = 100;
  const TOTAL_MS = 2_000;
  const t0 = performance.now();

  alive.add(id);

  while (true) {
    if (!alive.has(id)) return null;

    const end = performance.now() + SLICE_MS;
    while (performance.now() < end) {
      /* CPU slice */
    }

    const elapsed = performance.now() - t0;
    post({ type: 'progress', id, percent: Math.min(100, (elapsed / TOTAL_MS) * 100) });

    if (elapsed >= TOTAL_MS) break;
    await yieldSlice();
  }

  alive.delete(id);
  return '切片计算完成';
}

// ─── Blocking compute（不可切片 · 不可中断 · 无进度） ────────────────────────────

function blockingCompute(): string {
  const TOTAL_MS = 3_000;
  const t0 = performance.now();
  while (performance.now() - t0 < TOTAL_MS) {
    /* CPU blocking */
  }
  return '阻塞计算完成';
}

// ─── Request dispatch ───────────────────────────────────────────────────────────

const handle = async (msg: Extract<MainToWorkerMessage, { type: 'request' }>) => {
  const { id, action, payload, sentAt } = msg;

  try {
    let data: string;

    if (action in instant) {
      data = instant[action](payload);
    } else if (action === 'compute') {
      const result = await sliceableCompute(id);
      if (result === null) {
        return post({
          type: 'response',
          id,
          ok: false,
          action,
          error: '任务已取消',
          duration: Date.now() - sentAt,
        });
      }
      data = result;
    } else {
      data = blockingCompute();
    }

    post({ type: 'response', id, ok: true, action, data, duration: Date.now() - sentAt });
  } catch (e) {
    post({
      type: 'response',
      id,
      ok: false,
      action,
      error: e instanceof Error ? e.message : 'unknown worker error',
      duration: Date.now() - sentAt,
    });
  }
};

// ─── Entry ──────────────────────────────────────────────────────────────────────

post({ type: 'ready' });

self.onmessage = ({ data: msg }: MessageEvent<MainToWorkerMessage>) => {
  if (msg.type === 'cancel') {
    alive.delete(msg.id);
  } else {
    void handle(msg);
  }
};
