/**
 * Worker处理状态
 */
export interface IWorkerStatus {
  hashProgress: number;
  chunksProgress: number;
  isWorking: boolean;
  error: string | null;
  samplingEnabled?: boolean; // 是否启用采样
}

/**
 * 上传分片结构
 */
export interface IUploadChunk {
  index: number;
  blob: Blob;
}

/**
 * Worker处理选项
 */
export interface IWorkerOptions {
  hashChunkSize?: number; // 哈希计算分块大小
  reportInterval?: number; // 进度报告间隔
}

/**
 * Worker消息定义
 */
export interface IWorkerMessage {
  type: string;
  hash?: string;
  chunks?: IUploadChunk[];
  progress?: number;
  error?: string;
  samplingEnabled?: boolean;
}

/**
 * Promise解析和拒绝处理类型
 */
export type PromiseResolveType<T> = (value: T | PromiseLike<T>) => void;
export type PromiseRejectType = (reason?: unknown) => void;
