import type { MainToWorkerMessage, WorkerAction, WorkerToMainMessage } from './types';

// 根据 action 分发不同处理逻辑
const processAction = (action: WorkerAction, payload: string): string => {
  switch (action) {
    case 'echo':
      return payload;
    case 'uppercase':
      return payload.toUpperCase();
    default:
      throw new Error(`unsupported action: ${action satisfies never}`);
  }
};

self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const startedAt = Date.now();
  const message = event.data;

  // init 仅用于主线程握手
  if (message.kind === 'init') {
    const readyMessage: WorkerToMainMessage = {
      kind: 'ready',
      payload: 'demo2 worker is ready',
    };
    self.postMessage(readyMessage);
    return;
  }

  try {
    // request 消息：执行任务并返回成功结果
    const result = processAction(message.action, message.payload);

    const response: WorkerToMainMessage = {
      kind: 'response',
      id: message.id,
      ok: true,
      action: message.action,
      data: result,
      duration: Date.now() - message.sentAt,
    };

    self.postMessage(response);
  } catch (error) {
    // 异常兜底：返回错误回包
    const failResponse: WorkerToMainMessage = {
      kind: 'response',
      id: message.id,
      ok: false,
      action: message.action,
      error: error instanceof Error ? error.message : 'unknown worker error',
      duration: Date.now() - startedAt,
    };

    self.postMessage(failResponse);
  }
};
