/** 持续占用 CPU 直到耗尽目标时长 */
export const burnCPU = (ms: number) => {
  const start = performance.now();
  let seed = 0;
  // Math.sqrt 是个相对耗时的操作，可以更明显地模拟 CPU 密集型任务
  while (performance.now() - start < ms) seed += Math.sqrt((seed + 1) % 10_000);
};

/** 让出主线程，持续异步等待直到满足条件 */
export const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** 格式化毫秒数为字符串，null 显示为 '—' */
export const fmt = (ms: number | null) => (ms !== null ? `${ms.toFixed(2)} ms` : '—');
