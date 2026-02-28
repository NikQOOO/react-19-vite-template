import type { MainToWorkerMessage, WorkerToMainMessage } from './types';

/**
 * 计算 ArrayBuffer 的校验和
 *
 * 将所有字节累加，截断为 32 位无符号整数。
 * 用于验证：无论使用 Structured Clone 还是 Transferable，
 * Worker 收到的数据完全一致（校验和相同）。
 */
const computeChecksum = (buffer: ArrayBuffer): number => {
  const view = new Uint8Array(buffer);
  let sum = 0;
  for (let i = 0; i < view.length; i++) {
    sum = (sum + view[i]) | 0;
  }
  return sum >>> 0;
};

/**
 * Worker 消息处理入口
 *
 * 只处理两种消息：
 *  - `init`：握手请求，回复 ready 通知主线程 Worker 已就绪
 *  - `process`：接收 ArrayBuffer，计算校验和后返回结果与处理耗时
 *
 * Worker 无需关心数据是通过 Clone 还是 Transfer 方式传入的，
 * 两种方式到达 Worker 后的 ArrayBuffer 行为完全一致。
 */
self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const msg = event.data;

  if (msg.type === 'init') {
    self.postMessage({ type: 'ready' } satisfies WorkerToMainMessage);
    return;
  }

  const { id, buffer } = msg;

  const start = performance.now();
  const checksum = computeChecksum(buffer);
  const processTime = performance.now() - start;

  self.postMessage({
    type: 'result',
    id,
    checksum,
    byteLength: buffer.byteLength,
    processTime,
  } satisfies WorkerToMainMessage);
};
