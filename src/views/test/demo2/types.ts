// Worker 支持的任务类型
export type WorkerAction = 'echo' | 'uppercase';

// 主线程发送给 Worker 的消息协议
export type MainToWorkerMessage =
  | {
      // 初始化握手，Worker 收到后返回 ready
      kind: 'init';
    }
  | {
      // 请求消息：由 manager 生成唯一 id，Worker 处理后按 id 回包
      kind: 'request';
      id: number;
      action: WorkerAction;
      payload: string;
      sentAt: number;
    };

// Worker 返回给主线程的消息协议
export type WorkerToMainMessage =
  | {
      // 握手完成
      kind: 'ready';
      payload: string;
    }
  | {
      // 任务处理结果，ok 表示成功 / 失败
      kind: 'response';
      id: number;
      ok: boolean;
      action: WorkerAction;
      duration: number;
      data?: string;
      error?: string;
    };
