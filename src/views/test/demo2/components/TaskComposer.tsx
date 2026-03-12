import { Button, Input, Select, Space, Typography } from 'antd';
import { useState } from 'react';

import { ACTION_OPTIONS, DEFAULT_PAYLOAD_BY_ACTION } from '../constants';
import type { RunTaskOptions } from '../hooks/useDemo2Worker';
import type { WorkerAction } from '../types';

type TaskComposerProps = {
  isWorkerReady: boolean;
  runTask: (action: WorkerAction, options?: RunTaskOptions) => void;
};

const CONCURRENT_HINTS: Partial<Record<WorkerAction, string>> = {
  compute: '并发任务会在同一 Worker 中切片交替执行，主线程始终保持响应',
  blocking: '阻塞任务会在 Worker 中串行执行，期间不可取消，但主线程仍保持响应',
};

export const TaskComposer = ({ isWorkerReady, runTask }: TaskComposerProps) => {
  const [action, setAction] = useState<WorkerAction>('compute');
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD_BY_ACTION.compute);

  const isLongRunning = action === 'compute' || action === 'blocking';
  const canRun = isWorkerReady && (isLongRunning || payload.trim().length > 0);

  const handleActionChange = (next: WorkerAction) => {
    setAction(next);
    setPayload(DEFAULT_PAYLOAD_BY_ACTION[next]);
  };

  const handleRun = () => {
    if (isLongRunning) {
      runTask(action);
    } else {
      runTask(action, { payload });
    }
  };

  const handleRunConcurrent = () => {
    runTask(action);
    runTask(action);
    runTask(action);
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="small">
      <Space wrap>
        <Select
          style={{ width: 260 }}
          options={ACTION_OPTIONS}
          value={action}
          onChange={handleActionChange}
        />

        {!isLongRunning && (
          <Input
            style={{ width: 360 }}
            value={payload}
            placeholder="输入任意字符串"
            onChange={(e) => setPayload(e.target.value)}
            onPressEnter={handleRun}
          />
        )}

        <Button type="primary" onClick={handleRun} disabled={!canRun}>
          发起任务
        </Button>

        {isLongRunning && (
          <Button onClick={handleRunConcurrent} disabled={!isWorkerReady}>
            并发发起 3 个
          </Button>
        )}
      </Space>

      {CONCURRENT_HINTS[action] && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {CONCURRENT_HINTS[action]}
        </Typography.Text>
      )}
    </Space>
  );
};
