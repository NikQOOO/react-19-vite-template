/**
 * Demo3 — Transferable Objects 类型定义
 *
 * 两种传输模式共用同一套消息协议，Worker 无需感知传输方式的差异；
 * 传输模式的选择完全由主线程的 TransferChannel 在 postMessage 时决定。
 */

/** 传输模式：结构化克隆 vs Transferable 零拷贝 */
export type TransferMode = 'clone' | 'transfer';

// ─── 主线程 → Worker ───────────────────────────────────────────────────────────

export type MainToWorkerMessage =
  | { type: 'init' }
  | {
      /** 处理请求：主线程发送一个 ArrayBuffer，Worker 计算校验和后返回 */
      type: 'process';
      id: number;
      buffer: ArrayBuffer;
    };

// ─── Worker → 主线程 ───────────────────────────────────────────────────────────

export type WorkerToMainMessage =
  | { type: 'ready' }
  | {
      type: 'result';
      id: number;
      /** 所有字节累加的校验和（32 位无符号），用于验证数据完整性 */
      checksum: number;
      /** Worker 收到的 buffer 实际字节长度 */
      byteLength: number;
      /** Worker 侧计算耗时（毫秒） */
      processTime: number;
    };
