import type { ACTIONABLE_MSG_TYPES, ErrorCode, MSG_TYPE } from './constants';

type ValueOf<T> = T[keyof T];

export type WorkerMessageType = ValueOf<typeof MSG_TYPE>;

export type ActionableMessageType = (typeof ACTIONABLE_MSG_TYPES)[number];

export type MainToWorkerMessage = {
  msgType: (typeof ACTIONABLE_MSG_TYPES)[number];
  id: number;
  payload?: string;
  taskCount?: number;
  time: number;
};

export type WorkerToMainMessage = {
  msgType: WorkerMessageType;
  id: number;
  duration?: number;
  payload?: string;
  progress?: number;
};

export type ErrorCode = ValueOf<typeof ErrorCode>;
