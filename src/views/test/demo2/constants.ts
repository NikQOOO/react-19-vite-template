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
