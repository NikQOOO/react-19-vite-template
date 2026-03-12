import { MSG_TYPE } from '../constants';

import type { MainToWorkerMessage, WorkerToMainMessage } from '../typing';

type Scheduler = {
  postTask(cb: () => void, opts?: { priority?: string }): Promise<void>;
};

const tasks = new Set<number>();

// handlers
const post = (msg: WorkerToMainMessage) => self.postMessage(msg);

post({ msgType: MSG_TYPE.READY });

self.onmessage = async (evt: MessageEvent<MainToWorkerMessage>) => {
  const msg = evt.data;
};
