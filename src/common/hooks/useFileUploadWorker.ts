import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  IUploadChunk,
  IWorkerMessage,
  IWorkerOptions,
  IWorkerStatus,
  PromiseRejectType,
  PromiseResolveType,
} from '@/types/file-upload';

/**
 * 文件上传Worker钩子
 * 提供文件哈希计算和分片创建的高性能处理能力
 */
export default function useFileUploadWorker() {
  // ========================== State ==========================
  // 检查浏览器是否支持Web Worker
  const workerSupported = typeof Worker !== 'undefined';

  // Worker状态
  const [status, setStatus] = useState<IWorkerStatus>({
    hashProgress: 0,
    chunksProgress: 0,
    isWorking: false,
    error: workerSupported ? null : '当前浏览器不支持Web Worker',
  });

  // Worker引用
  const workerRef = useRef<Worker | null>(null);

  // 事件处理器引用（避免依赖链问题）
  const handlersRef = useRef<{
    onMessage: (event: MessageEvent<IWorkerMessage>) => void;
    onError: (error: unknown) => void;
  } | null>(null);

  // 等待中的Promise对象
  const pendingPromises = useRef<
    Record<
      string,
      {
        resolve: PromiseResolveType<unknown>;
        reject: PromiseRejectType;
      }
    >
  >({});

  // ========================== Handlers ==========================

  /**
   * 检查浏览器是否支持Web Worker
   */
  const isWorkerSupported = (): boolean => {
    return typeof Worker !== 'undefined';
  };

  /**
   * 创建Worker实例
   */
  const createWorker = useCallback((): Worker => {
    return new Worker(new URL('../../workers/fileUploadWorker.ts', import.meta.url), {
      type: 'module',
    });
  }, []);

  /**
   * 解析指定操作的Promise
   */
  const resolvePromise = useCallback((operation: string, value: unknown): void => {
    if (pendingPromises.current[operation]) {
      pendingPromises.current[operation].resolve(value);
      delete pendingPromises.current[operation];
    }
  }, []);

  /**
   * 拒绝所有等待中的Promise
   */
  const rejectAllPromises = (reason: string): void => {
    Object.keys(pendingPromises.current).forEach((key) => {
      pendingPromises.current[key].reject(new Error(reason));
      delete pendingPromises.current[key];
    });
  };

  /**
   * 更新哈希计算进度
   */
  const updateHashProgress = useCallback((data: IWorkerMessage): void => {
    setStatus((prev) => ({
      ...prev,
      hashProgress: data.progress || 0,
      samplingEnabled: data.samplingEnabled,
    }));
  }, []);

  /**
   * 更新分片创建进度
   */
  const updateChunksProgress = useCallback((data: IWorkerMessage): void => {
    setStatus((prev) => ({
      ...prev,
      chunksProgress: data.progress || 0,
    }));
  }, []);

  /**
   * 完成哈希计算
   */
  const completeHashCalculation = useCallback(
    (data: IWorkerMessage): void => {
      setStatus((prev) => ({
        ...prev,
        isWorking: false,
        hashProgress: 100,
      }));

      resolvePromise('calculateHash', data.hash);
    },
    [resolvePromise],
  );

  /**
   * 完成分片创建
   */
  const completeChunksCreation = useCallback(
    (data: IWorkerMessage): void => {
      setStatus((prev) => ({
        ...prev,
        isWorking: false,
        chunksProgress: 100,
      }));

      resolvePromise('createChunks', data.chunks);
    },
    [resolvePromise],
  );

  /**
   * 处理Worker错误
   */
  const handleWorkerError = useCallback((error: unknown): void => {
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    setStatus((prev) => ({
      ...prev,
      isWorking: false,
      error: errorMessage,
    }));

    // 拒绝所有等待中的Promise
    rejectAllPromises(errorMessage);
  }, []);

  /**
   * 计算文件哈希
   * @param file 要计算哈希的文件
   * @param options 可选的处理选项
   * @returns 文件哈希值的Promise
   */
  const calculateFileHash = (file: File, options?: IWorkerOptions): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker未初始化'));
        return;
      }

      // 重置状态
      setStatus((prev) => ({
        ...prev,
        isWorking: true,
        hashProgress: 0,
        error: null,
        samplingEnabled: false,
      }));

      // 保存Promise
      pendingPromises.current['calculateHash'] = {
        resolve: resolve as PromiseResolveType<unknown>,
        reject,
      };

      // 发送消息给Worker
      workerRef.current.postMessage({
        type: 'CALCULATE_HASH',
        file,
        options,
      });
    });
  };

  /**
   * 创建文件分片
   * @param file 要分片的文件
   * @param chunkSize 每个分片的大小
   * @param options 可选的处理选项
   * @returns 文件分片数组的Promise
   */
  const createFileChunks = (file: File, chunkSize: number, options?: IWorkerOptions): Promise<IUploadChunk[]> => {
    return new Promise<IUploadChunk[]>((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker未初始化'));
        return;
      }

      // 重置状态
      setStatus((prev) => ({
        ...prev,
        isWorking: true,
        chunksProgress: 0,
        error: null,
      }));

      // 保存Promise
      pendingPromises.current['createChunks'] = {
        resolve: resolve as PromiseResolveType<unknown>,
        reject,
      };

      // 发送消息给Worker
      workerRef.current.postMessage({
        type: 'CREATE_CHUNKS',
        file,
        chunkSize,
        options,
      });
    });
  };

  /**
   * 处理Worker消息
   */
  const handleWorkerMessage = useCallback(
    (event: MessageEvent<IWorkerMessage>): void => {
      const { type } = event.data;

      switch (type) {
        case 'HASH_PROGRESS':
          updateHashProgress(event.data);
          break;

        case 'CHUNKS_PROGRESS':
          updateChunksProgress(event.data);
          break;

        case 'HASH_COMPLETE':
          completeHashCalculation(event.data);
          break;

        case 'CHUNKS_CREATED':
          completeChunksCreation(event.data);
          break;

        case 'ERROR':
          handleWorkerError(event.data.error);
          break;

        default:
          break;
      }
    },
    [updateHashProgress, updateChunksProgress, completeHashCalculation, completeChunksCreation, handleWorkerError],
  );

  // ========================== Effects ==========================
  // 同步更新事件处理器引用
  useEffect(() => {
    handlersRef.current = {
      onMessage: handleWorkerMessage,
      onError: handleWorkerError,
    };
  }, [handleWorkerMessage, handleWorkerError]);

  /**
   * 初始化Worker（只执行一次）
   */
  useEffect(() => {
    if (!isWorkerSupported()) {
      return;
    }

    let worker: Worker;
    try {
      worker = createWorker();
    } catch (error) {
      console.error('Worker创建失败:', error);
      return;
    }

    // 通过 ref 间接调用，避免依赖链问题
    worker.onmessage = (event) => handlersRef.current?.onMessage(event);
    worker.onerror = (error) => handlersRef.current?.onError(error);
    workerRef.current = worker;

    // 组件卸载时清理
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [createWorker]);

  return {
    status,
    calculateFileHash,
    createFileChunks,
    isWorkerSupported: isWorkerSupported(),
  };
}
