import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ProcessResult } from '../TransferChannel';
import { TransferChannel } from '../TransferChannel';
import type { TransferMode } from '../types';

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

/** 一轮对比测试的结果（同一数据分别用 clone 和 transfer 发送） */
export type BenchmarkRound = {
  id: number;
  /** 参与对比的 buffer 大小（字节） */
  bufferSize: number;
  /** Structured Clone 模式的结果 */
  clone: ProcessResult | null;
  /** Transferable 模式的结果 */
  transfer: ProcessResult | null;
  /** 本轮测试的时间戳 */
  timestamp: number;
};

/** 单次发送的日志条目，用于教学目的展示每次操作的细节 */
export type TransferLog = {
  id: number;
  mode: TransferMode;
  bufferSize: number;
  result: ProcessResult | null;
  error: string | null;
  timestamp: number;
};

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

/**
 * 生成指定大小的随机填充 ArrayBuffer
 *
 * 使用 crypto.getRandomValues 分批填充（每批 64KB，
 * 因为 getRandomValues 单次最大仅支持 65536 字节）。
 * 随机数据确保 Structured Clone 无法走快速路径优化，
 * 使得对比结果更贴近真实场景。
 */
const createRandomBuffer = (byteLength: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(byteLength);
  const view = new Uint8Array(buffer);
  const CHUNK = 65_536;
  for (let offset = 0; offset < byteLength; offset += CHUNK) {
    const end = Math.min(offset + CHUNK, byteLength);
    crypto.getRandomValues(view.subarray(offset, end));
  }
  return buffer;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useDemo3Worker
 *
 * 封装 TransferChannel 的生命周期、基准测试调度与日志管理：
 *  - mount 时初始化 Worker 并等待握手就绪
 *  - unmount 时终止 Worker
 *  - `runBenchmark`：以相同数据分别进行 clone 和 transfer 发送，收集对比结果
 *  - `sendOnce`：单次发送，用于自由实验
 */
export const useDemo3Worker = () => {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [benchmarks, setBenchmarks] = useState<BenchmarkRound[]>([]);
  const [logs, setLogs] = useState<TransferLog[]>([]);

  const channelRef = useRef<TransferChannel | null>(null);
  const mountedRef = useRef(true);
  const roundIdRef = useRef(1);
  const logIdRef = useRef(1);

  // ─── 追加日志 ──────────────────────────────────────────────────────────────

  const appendLog = useCallback((entry: Omit<TransferLog, 'id' | 'timestamp'>) => {
    if (!mountedRef.current) return;
    setLogs((prev) => [...prev, { ...entry, id: logIdRef.current++, timestamp: Date.now() }]);
  }, []);

  // ─── 单次发送 ──────────────────────────────────────────────────────────────

  /**
   * 向 Worker 发送指定大小的 buffer，使用指定模式
   *
   * @returns ProcessResult 或 null（发送失败时）
   */
  const sendOnce = useCallback(
    async (bufferSize: number, mode: TransferMode): Promise<ProcessResult | null> => {
      const channel = channelRef.current;
      if (!channel) return null;

      try {
        const buffer = createRandomBuffer(bufferSize);
        const result = await channel.send(buffer, mode);
        appendLog({ mode, bufferSize, result, error: null });
        return result;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '发送失败';
        appendLog({ mode, bufferSize, result: null, error: errMsg });
        return null;
      }
    },
    [appendLog],
  );

  // ─── 对比基准测试 ──────────────────────────────────────────────────────────

  /**
   * 以相同大小的随机数据，顺序执行 clone → transfer 两次发送，
   * 收集对比结果形成一轮 BenchmarkRound。
   *
   * 为什么不用同一个 buffer？
   * 因为 transfer 会 detach 原 buffer，clone 之后 buffer 虽然仍可用，
   * 但为了公平对比，每次都用全新的随机数据。
   */
  const runBenchmark = useCallback(
    async (bufferSize: number) => {
      const channel = channelRef.current;
      if (!channel || isRunning) return;

      setIsRunning(true);

      const roundId = roundIdRef.current++;

      try {
        // 第一轮：Structured Clone
        const cloneResult = await sendOnce(bufferSize, 'clone');

        // 第二轮：Transferable
        const transferResult = await sendOnce(bufferSize, 'transfer');

        if (!mountedRef.current) return;

        const round: BenchmarkRound = {
          id: roundId,
          bufferSize,
          clone: cloneResult,
          transfer: transferResult,
          timestamp: Date.now(),
        };

        setBenchmarks((prev) => [...prev, round]);
      } catch {
        message.error('基准测试失败');
      } finally {
        if (mountedRef.current) {
          setIsRunning(false);
        }
      }
    },
    [isRunning, sendOnce],
  );

  // ─── 清除历史 ──────────────────────────────────────────────────────────────

  const clearAll = useCallback(() => {
    setBenchmarks([]);
    setLogs([]);
  }, []);

  // ─── Worker 生命周期管理 ────────────────────────────────────────────────────

  useEffect(() => {
    let effectAlive = true;
    mountedRef.current = true;

    const channel = new TransferChannel({ readyTimeout: 5_000 });
    channelRef.current = channel;

    void channel.ready
      .then(() => {
        if (!effectAlive) return;
        setIsWorkerReady(true);
      })
      .catch((error) => {
        if (!effectAlive) return;
        const errorText = error instanceof Error ? error.message : 'Worker 初始化失败';
        setIsWorkerReady(false);
        message.error('Demo3 初始化失败：' + errorText);
      });

    return () => {
      effectAlive = false;
      mountedRef.current = false;
      channelRef.current?.terminate();
      channelRef.current = null;
      setIsWorkerReady(false);
    };
  }, []);

  return {
    isWorkerReady,
    isRunning,
    benchmarks,
    logs,
    runBenchmark,
    sendOnce,
    clearAll,
  };
};
