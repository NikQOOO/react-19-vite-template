type MainToWorkerMessage = {
  id: number;
  type: 'echo' | 'ping';
  payload: string;
  sentAt: number;
};

type WorkerToMainMessage = {
  id?: number;
  type: 'ready' | 'echo-result' | 'error';
  payload: string;
  duration?: number;
};

/**
 * Worker 消息入口。
 *
 * 设计约束：
 * 1) 所有输入必须符合 MainToWorkerMessage 协议；
 * 2) 所有输出必须符合 WorkerToMainMessage 协议；
 * 3) 任何异常都要转换为 error 回包，避免主线程“静默失败”。
 */
self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  /**
   * 统一使用 Date.now() 记录起点：
   * - 便于与主线程 sentAt（同样 Date.now）做跨线程耗时计算；
   * - 避免不同线程的 performance.now 基准不一致导致负值。
   */
  const startedAt = Date.now();

  try {
    const data = event.data;

    /**
     * 输入校验分支：
     * - 协议不合法时，返回可观测的 error 回包；
     * - 不直接 throw，避免把可恢复问题升级为运行时崩溃。
     */
    if (!data || (data.type !== 'echo' && data.type !== 'ping')) {
      const invalidResponse: WorkerToMainMessage = {
        id: Date.now(),
        type: 'error',
        payload: 'invalid message received by worker',
        duration: Date.now() - startedAt,
      };
      self.postMessage(invalidResponse);
      return;
    }

    /**
     * 初始化握手：
     * ping -> ready
     * 仅用于告知主线程“worker 可用”，不参与业务处理。
     */
    if (data.type === 'ping') {
      const readyResponse: WorkerToMainMessage = {
        type: 'ready',
        payload: 'worker initialized successfully.',
      };
      self.postMessage(readyResponse);
      return;
    }

    /**
     * 业务分支（echo）：
     * - 原样回显 payload；
     * - duration 使用“当前时间 - sentAt”表示端到端往返耗时（粗粒度）。
     */
    const response: WorkerToMainMessage = {
      id: data.id,
      type: 'echo-result',
      payload: `received payload -> ${data.payload}`,
      duration: Date.now() - data.sentAt,
    };

    self.postMessage(response);
  } catch {
    /**
     * 兜底异常分支：
     * - 捕获未知异常并回传 error；
     * - 保证主线程可观测（日志/告警），便于定位问题。
     */
    const errorResponse: WorkerToMainMessage = {
      id: Date.now(),
      type: 'error',
      payload: 'worker failed to process the message',
      duration: Date.now() - startedAt,
    };

    self.postMessage(errorResponse);
  }
};
