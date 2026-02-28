import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';

import type { WorkerAction } from '../types';
import { isWorkerChannelError, WORKER_CHANNEL_ERROR_CODE, WorkerChannel } from '../WorkerChannel';

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

/** 单个任务的完整运行快照 */
export type TaskEntry = {
  /** UI 层任务 id（自增），用于列表渲染与取消操作 */
  id: number;
  action: WorkerAction;
  /** 任务展示名称，由任务类型和参数拼接而成 */
  label: string;
  /** compute 任务的实时进度（0–100），其余任务固定为 0 */
  progress: number;
  status: 'running' | 'done' | 'cancelled' | 'error';
  /** 任务结果文本或错误信息 */
  result: string;
  /** 从发送到 Worker 到收到响应的往返时长（毫秒） */
  duration: number;
};

/** 发起任务时的可选配置 */
export type RunTaskOptions = {
  /** 字符串类任务（echo / uppercase）的输入内容 */
  payload?: string;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useDemo2Worker
 *
 * 封装 WorkerChannel 的生命周期管理与任务调度逻辑：
 *  - 在 mount 时初始化 Worker 并等待握手就绪
 *  - 在 unmount 时终止 Worker 并清理所有引用
 *  - 通过 `runTask` 发起任务，实时同步进度和最终状态到 React 状态
 *  - 通过 `cancelTask` 软取消正在运行的 compute 任务
 *  - 通过 `clearTasks` 清空历史记录（保留运行中的任务）
 */
export const useDemo2Worker = () => {
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  const channelRef = useRef<WorkerChannel | null>(null);
  /** UI 任务 id 计数器，保证每次 runTask 分配唯一 id */
  const uiTaskIdRef = useRef(1);
  /** 组件挂载标志，用于在异步回调中阻止已卸载组件的状态更新 */
  const mountedRef = useRef(true);
  /** UI 任务 id → Worker 请求 id 的映射，用于将取消操作路由到正确的 Worker 请求 */
  const taskWorkerIdMap = useRef(new Map<number, number>());

  // ─── 任务发起 ────────────────────────────────────────────────────────────────

  const runTask = (action: WorkerAction, options: RunTaskOptions = {}) => {
    const channel = channelRef.current;
    if (!channel || !isWorkerReady) return;

    const { payload = '' } = options;
    const uiId = uiTaskIdRef.current++;
    const label = action === 'compute' ? 'Compute' : `${action}: "${payload}"`;

    // 立即将任务追加到列表，提供即时的 UI 反馈
    setTasks((prev) => [
      ...prev,
      { id: uiId, action, label, progress: 0, status: 'running', result: '', duration: 0 },
    ]);

    /**
     * 异步执行体：向 Worker 发送请求并将结果/错误回写到 React 状态。
     * 提取为具名函数，避免匿名 IIFE 降低可读性。
     */
    const executeTask = async () => {
      try {
        const result = await channel.request(action, payload, {
          // Worker 分配 id 后同步回调，提前建立 UI id → Worker id 映射
          onRequestId: (workerId) => {
            taskWorkerIdMap.current.set(uiId, workerId);
          },
          // compute 任务每个切片都会触发，实时更新进度条
          onProgress: (percent) => {
            if (!mountedRef.current) return;
            setTasks((prev) => prev.map((t) => (t.id === uiId ? { ...t, progress: percent } : t)));
          },
        });

        if (!mountedRef.current) return;

        setTasks((prev) =>
          prev.map((t) =>
            t.id === uiId
              ? {
                  ...t,
                  status: 'done',
                  label:
                    action === 'compute'
                      ? `Compute (${(result.duration / 1000).toFixed(1)}s)`
                      : t.label,
                  result: result.data,
                  duration: result.duration,
                  progress: 100,
                }
              : t,
          ),
        );
      } catch (error) {
        if (!mountedRef.current) return;

        const errMsg = error instanceof Error ? error.message : 'unknown error';
        // 取消操作属于正常流程，不触发 message.error 提示
        const isCancelled =
          isWorkerChannelError(error) && error.code === WORKER_CHANNEL_ERROR_CODE.REQUEST_CANCELLED;

        setTasks((prev) =>
          prev.map((t) =>
            t.id === uiId
              ? { ...t, status: isCancelled ? 'cancelled' : 'error', result: errMsg }
              : t,
          ),
        );

        if (!isCancelled) {
          message.error('任务执行失败：' + errMsg);
        }
      } finally {
        // 无论成功、失败还是取消，都要清理映射条目
        taskWorkerIdMap.current.delete(uiId);
      }
    };

    void executeTask();
  };

  // ─── 取消任务 ────────────────────────────────────────────────────────────────

  /**
   * 按 UI 任务 id 取消运行中的 compute 任务
   *
   * 内部将 UI id 转换为 Worker 请求 id，再调用 `WorkerChannel.cancel()`。
   * 对非 compute 任务或已完成的任务调用此方法无副作用。
   */
  const cancelTask = (uiId: number) => {
    const workerId = taskWorkerIdMap.current.get(uiId);
    if (workerId != null) {
      channelRef.current?.cancel(workerId);
    }
  };

  // ─── 清空历史 ────────────────────────────────────────────────────────────────

  /** 保留运行中的任务，清除其余所有历史记录 */
  const clearTasks = () => {
    setTasks((prev) => prev.filter((t) => t.status === 'running'));
  };

  // ─── Worker 生命周期管理 ──────────────────────────────────────────────────────

  useEffect(() => {
    // 局部标志：仅追踪本次 effect 实例是否仍存活。
    // 不能复用 mountedRef，因为 StrictMode 下 cleanup 与下一次 mount 交错执行时，
    // mountedRef 会被下一次 mount 重置为 true，导致本次 effect 的异步回调误判为仍存活。
    let effectAlive = true;

    mountedRef.current = true;

    const channel = new WorkerChannel({ readyTimeout: 5_000 });
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
        message.error('Demo2 初始化失败：' + errorText);
      });

    return () => {
      effectAlive = false;
      mountedRef.current = false;
      channelRef.current?.terminate();
      channelRef.current = null;
      setIsWorkerReady(false);
    };
  }, []);

  return { tasks, isWorkerReady, runTask, cancelTask, clearTasks };
};
