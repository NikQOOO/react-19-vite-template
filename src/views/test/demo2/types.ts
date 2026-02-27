/** Worker 支持的任务类型 */
export type WorkerAction = 'echo' | 'uppercase' | 'compute';

// ─── 主线程 → Worker ───────────────────────────────────────────────────────────

/**
 * 主线程发往 Worker 的消息协议（判别联合类型，以 `type` 字段区分）
 *
 * - `init`    握手请求，Worker 收到后回复 `ready`
 * - `request` 任务请求，Worker 处理后用相同 `id` 回包
 * - `cancel`  软取消，在下一个切片检查点生效
 */
export type MainToWorkerMessage =
  | {
      type: 'init';
    }
  | {
      type: 'request';
      /** 请求唯一标识，由 WorkerChannel 自增生成，用于匹配响应 */
      id: number;
      action: WorkerAction;
      /** 字符串类任务的输入内容，compute 任务传空字符串 */
      payload: string;
      /** 消息发出时的时间戳（`Date.now()`），用于计算往返耗时 */
      sentAt: number;
    }
  | {
      type: 'cancel';
      /** 要取消的任务 id，与对应 `request` 消息的 `id` 一致 */
      id: number;
    };

// ─── Worker → 主线程 ───────────────────────────────────────────────────────────

/**
 * Worker 发往主线程的消息协议（判别联合类型，以 `type` 字段区分）
 *
 * - `ready`    握手完成通知
 * - `progress` compute 任务进度上报（0–100）
 * - `response` 任务最终结果（成功或失败）
 */
export type WorkerToMainMessage =
  | {
      type: 'ready';
      /** Worker 就绪后附带的描述文本，可用于调试日志 */
      payload: string;
    }
  | {
      type: 'progress';
      /** 对应任务的请求 id */
      id: number;
      /** 当前进度百分比（0–100） */
      percent: number;
    }
  | {
      type: 'response';
      /** 对应任务的请求 id */
      id: number;
      /** `true` 表示任务成功完成，`false` 表示失败或被取消 */
      ok: boolean;
      action: WorkerAction;
      /** 从 `sentAt` 到 Worker 回包的实际耗时（毫秒） */
      duration: number;
      /** 任务成功时的结果文本 */
      data?: string;
      /** 任务失败时的错误描述 */
      error?: string;
    };
