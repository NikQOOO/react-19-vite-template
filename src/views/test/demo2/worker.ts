import type { MainToWorkerMessage, WorkerToMainMessage } from './types';

/** 正在运行的 compute 任务 id 集合，用于软取消标记 */
const activeTasks = new Set<number>();

/**
 * 即时任务分发表（echo / uppercase）
 *
 * 用 Record 替代 if/else，新增任务类型时只需扩展此映射即可，
 * 无需修改调用方逻辑。
 */
const instantHandlers: Record<'echo' | 'uppercase', (payload: string) => string> = {
  echo: (payload) => payload,
  uppercase: (payload) => payload.toUpperCase(),
};

/**
 * CPU 密集型任务（compute）
 *
 * 将总时长切分为若干 100ms 的 CPU 切片，每个切片结束后：
 *  1. 向主线程上报当前进度百分比（0–100）
 *  2. 通过 `setTimeout(0)` 让出事件循环，使 cancel 消息得以在切片间介入
 *
 * @param id Worker 内部请求 id，与主线程对应
 * @returns 'ok' 表示正常完成，'cancelled' 表示已被软取消
 */
const processCompute = async (id: number): Promise<'ok' | 'cancelled'> => {
  /** 每个 CPU 切片的目标时长（毫秒） */
  const SLICE_MS = 100;
  /**
   * 模拟 CPU 密集型任务的总时长（毫秒）。
   * 此为 Demo 写死的固定值，用于驱动进度计算与空转循环；
   * 真实业务中应替换为实际的计算逻辑，耗时由计算量自然决定。
   */
  const DURATION_MS = 2_000;
  const start = performance.now();

  activeTasks.add(id);

  while (true) {
    // 软取消检查点：若 cancel 消息已将此 id 从集合移除，立即退出
    if (!activeTasks.has(id)) return 'cancelled';

    // 推算一个 CPU 切片，模拟真实计算负载
    const sliceStart = performance.now();
    while (performance.now() - sliceStart < SLICE_MS) {
      /* 模拟 CPU 占用 */
    }

    const elapsed = performance.now() - start;
    const percent = Math.min(100, (elapsed / DURATION_MS) * 100);

    // 向主线程上报本切片结束后的累计进度
    self.postMessage({ type: 'progress', id, percent } satisfies WorkerToMainMessage);

    if (elapsed >= DURATION_MS) break;

    // 让出事件循环——cancel / 新 request 消息可在此切片间隙介入处理
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  activeTasks.delete(id);
  return 'ok';
};

/**
 * Worker 消息处理入口
 *
 * 声明为 async，使多个 compute 任务能在 await 让出点处交错运行，
 * 而不会相互阻塞。消息分三类：
 *  - `init`    握手请求，回复 ready 通知主线程 Worker 已就绪
 *  - `cancel`  软取消：从活跃集合中移除目标 id，下一切片检查点生效
 *  - `request` 任务请求：compute 走异步切片流程，其余走同步即时处理
 */
self.onmessage = async (event: MessageEvent<MainToWorkerMessage>) => {
  const msg = event.data;

  if (msg.type === 'init') {
    self.postMessage({
      type: 'ready',
      payload: 'Demo2 Worker 已就绪',
    } satisfies WorkerToMainMessage);
    return;
  }

  if (msg.type === 'cancel') {
    activeTasks.delete(msg.id);
    return;
  }

  const { id, action, payload, sentAt } = msg;

  try {
    if (action === 'compute') {
      // 异步切片任务：支持进度上报与软取消
      const status = await processCompute(id);
      self.postMessage({
        type: 'response',
        id,
        ok: status === 'ok',
        action,
        data: status === 'ok' ? '计算完成' : '任务已取消',
        duration: Date.now() - sentAt,
      } satisfies WorkerToMainMessage);
    } else {
      // 即时任务：同步完成，直接通过分发表取得结果
      self.postMessage({
        type: 'response',
        id,
        ok: true,
        action,
        data: instantHandlers[action](payload),
        duration: Date.now() - sentAt,
      } satisfies WorkerToMainMessage);
    }
  } catch (error) {
    self.postMessage({
      type: 'response',
      id,
      ok: false,
      action,
      error: error instanceof Error ? error.message : '未知 Worker 错误',
      duration: Date.now() - sentAt,
    } satisfies WorkerToMainMessage);
  }
};
