import { MSG_TYPE } from '../constants';

import type { MainToWorkerMessage, WorkerToMainMessage } from '../typing';

/** 任务队列 */
const tasks = new Set<number>();

// 发送消息到主线程
const emit = (msg: WorkerToMainMessage) => self.postMessage(msg);

// —————— 切片任务 ——————————————————————————————————
type Scheduler = {
  postTask(cb: () => void, opts?: { priority?: string }): Promise<void>;
};

// —————— 耗时任务 ——————————————————————————————————

const blockingCompute = async () => {
  const start = Date.now();
};

// —————— 基本方法 ——————————————————————————————————
// 处理主线程发来的消息
const dispatchTask = async (msg: MainToWorkerMessage) => {
  const { id, payload, time, taskCount } = msg;
  switch (msg.msgType) {
    case MSG_TYPE.CANCEL_EXPENSIVE_COMPUTE:
      // 从任务队列中移除对应 ID，达到软取消的效果
      tasks.delete(id);
      break;
    case MSG_TYPE.EXPENSIVE_COMPUTE:
      await blockingCompute();
  }
};

// —————— Worker 入口 ————————————————————————————————————

// 线程准备就绪
emit({ msgType: MSG_TYPE.READY, id: -1 });

self.onmessage = async (evt: MessageEvent<MainToWorkerMessage>) => {
  dispatchTask(evt.data).catch((err) => {
    emit({
      msgType: MSG_TYPE.ERROR,
      id: evt.data.id,
      payload: err.message,
      // 计算耗时 （从主线程发出任务到 Worker 捕获错误的时间差，包含了调度延迟和执行时间）
      duration: Date.now() - evt.data.time,
    });
  });
};
