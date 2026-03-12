import type { MainToWorkerMessage, WorkerToMainMessage } from './types';

const post = (msg: WorkerToMainMessage) => self.postMessage(msg);

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

// Worker 加载即就绪，无需握手
post({ type: 'ready' });

self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const { id, buffer } = event.data;

  const start = performance.now();
  const checksum = computeChecksum(buffer);
  const processTime = performance.now() - start;

  post({ type: 'result', id, checksum, byteLength: buffer.byteLength, processTime });
};
