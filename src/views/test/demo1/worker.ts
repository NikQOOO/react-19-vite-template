import type { MainToWorkerMsg, WorkerToMainMsg } from './types';

/** 持续占用 CPU 直到耗尽目标时长，模拟计算密集型任务 */
const burnCpu = (durationMs: number) => {
  const start = performance.now();
  let seed = 0;
  while (performance.now() - start < durationMs) {
    seed += Math.sqrt((seed + 1) % 10_000);
  }
  return seed;
};

// Worker 模块加载完毕后立即通知主线程
self.postMessage({ type: 'ready' } satisfies WorkerToMainMsg);

self.onmessage = (event: MessageEvent<MainToWorkerMsg>) => {
  const start = performance.now();
  burnCpu(event.data.durationMs);
  self.postMessage({
    type: 'result',
    duration: performance.now() - start,
  } satisfies WorkerToMainMsg);
};
