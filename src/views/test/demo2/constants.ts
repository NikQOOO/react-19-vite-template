import type { WorkerAction } from './types';

export const ACTION_OPTIONS: Array<{ label: string; value: WorkerAction }> = [
  { label: 'Echo（原样返回）', value: 'echo' },
  { label: 'Uppercase（转大写）', value: 'uppercase' },
  { label: 'Compute（CPU 密集）', value: 'compute' },
];

export const DEFAULT_PAYLOAD_BY_ACTION: Record<WorkerAction, string> = {
  echo: 'hello worker',
  uppercase: 'hello manager',
  compute: '',
};

/** compute 任务可选时长 */
export const COMPUTE_DURATION_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '2 秒', value: 2000 },
  { label: '4 秒', value: 4000 },
  { label: '6 秒', value: 6000 },
  { label: '8 秒', value: 8000 },
];
