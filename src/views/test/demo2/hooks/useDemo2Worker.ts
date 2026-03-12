import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';

import type { WorkerAction } from '../types';
import { ErrorCode, isWorkerChannelError, WorkerChannel } from '../WorkerChannel';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type TaskEntry = {
  id: number;
  action: WorkerAction;
  label: string;
  progress: number;
  status: 'running' | 'done' | 'cancelled' | 'error';
  result: string;
  duration: number;
};

export type RunTaskOptions = { payload?: string };

// ─── Helpers ────────────────────────────────────────────────────────────────────

const TASK_LABELS: Record<WorkerAction, (payload: string) => string> = {
  echo: (p) => `echo: "${p}"`,
  uppercase: (p) => `uppercase: "${p}"`,
  compute: () => 'Compute（可切片）',
  blocking: () => 'Blocking（不可切片）',
};

const isLongRunning = (a: WorkerAction) => a === 'compute' || a === 'blocking';

// ─── Hook ───────────────────────────────────────────────────────────────────────

export const useDemo2Worker = () => {
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  const channelRef = useRef<WorkerChannel | null>(null);
  const nextId = useRef(1);
  const mounted = useRef(true);
  /** UI task id → Worker request id */
  const idMap = useRef(new Map<number, number>());

  const patch = (id: number, delta: Partial<TaskEntry>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...delta } : t)));

  const runTask = (action: WorkerAction, { payload = '' }: RunTaskOptions = {}) => {
    const ch = channelRef.current;
    if (!ch || !isWorkerReady) return;

    const uid = nextId.current++;
    const label = TASK_LABELS[action](payload);

    setTasks((prev) => [
      ...prev,
      { id: uid, action, label, progress: 0, status: 'running', result: '', duration: 0 },
    ]);

    void (async () => {
      try {
        const res = await ch.request(action, payload, {
          onRequestId: (wid) => idMap.current.set(uid, wid),
          onProgress: (pct) => mounted.current && patch(uid, { progress: pct }),
        });

        if (!mounted.current) return;

        patch(uid, {
          status: 'done',
          result: res.data,
          duration: res.duration,
          progress: 100,
          ...(isLongRunning(action)
            ? { label: `${label} (${(res.duration / 1000).toFixed(1)}s)` }
            : {}),
        });
      } catch (e) {
        if (!mounted.current) return;

        const cancelled = isWorkerChannelError(e) && e.code === ErrorCode.CANCELLED;
        const errMsg = e instanceof Error ? e.message : 'unknown';

        patch(uid, { status: cancelled ? 'cancelled' : 'error', result: errMsg });
        if (!cancelled) message.error(`任务失败：${errMsg}`);
      } finally {
        idMap.current.delete(uid);
      }
    })();
  };

  const cancelTask = (uid: number) => {
    const wid = idMap.current.get(uid);
    if (wid != null) channelRef.current?.cancel(wid);
  };

  const clearTasks = () => setTasks((prev) => prev.filter((t) => t.status === 'running'));

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let alive = true;
    mounted.current = true;

    const ch = new WorkerChannel(new URL('../worker.ts', import.meta.url), { readyTimeout: 5_000 });
    channelRef.current = ch;

    ch.ready
      .then(() => alive && setIsWorkerReady(true))
      .catch((e) => {
        if (!alive) return;
        setIsWorkerReady(false);
        message.error(`Worker 初始化失败：${e instanceof Error ? e.message : 'unknown'}`);
      });

    return () => {
      alive = false;
      mounted.current = false;
      ch.terminate();
      channelRef.current = null;
      setIsWorkerReady(false);
    };
  }, []);

  return { tasks, isWorkerReady, runTask, cancelTask, clearTasks };
};
