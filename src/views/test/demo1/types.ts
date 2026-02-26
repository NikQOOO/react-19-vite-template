/** 主线程  Worker：要执行的任务时长 */
export type MainToWorkerMsg = {
  durationMs: number;
};

/** Worker → 主线程 */
export type WorkerToMainMsg = { type: 'ready' } | { type: 'result'; duration: number };
