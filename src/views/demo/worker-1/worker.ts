import { burnCPU } from './utils';

export type WorkerToMainMsg = { type: 'ready' } | { type: 'done'; duration: number };
export type MainToWorkerMsg = { durationMs: number };

// Worker 模块加载完毕后立即通知主线程
const msg = { type: 'ready' } satisfies WorkerToMainMsg;
self.postMessage(msg);

// 接收主线程发送的任务消息，执行任务并将结果返回主线程
self.onmessage = (event: MessageEvent<MainToWorkerMsg>) => {
  const start = performance.now();
  burnCPU(event.data.durationMs);
  const resultMsg = {
    type: 'done',
    duration: performance.now() - start,
  } satisfies WorkerToMainMsg;
  self.postMessage(resultMsg);
};
