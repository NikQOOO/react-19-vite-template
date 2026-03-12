/** 按执行模型分类的 Worker 任务类型 */
export type InstantAction = 'echo' | 'uppercase';
export type SliceableAction = 'compute';
export type BlockingAction = 'blocking';
export type WorkerAction = InstantAction | SliceableAction | BlockingAction;

// ─── Main → Worker ─────────────────────────────────────────────────────────────

export type MainToWorkerMessage =
  | { type: 'request'; id: number; action: WorkerAction; payload: string; sentAt: number }
  | { type: 'cancel'; id: number };

// ─── Worker → Main ─────────────────────────────────────────────────────────────

export type WorkerToMainMessage =
  | { type: 'ready' }
  | { type: 'progress'; id: number; percent: number }
  | ({ type: 'response'; id: number; action: WorkerAction; duration: number } & (
      | { ok: true; data: string }
      | { ok: false; error: string }
    ));
