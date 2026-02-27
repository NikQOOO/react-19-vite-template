import { Button, Input, Select, Space, Typography } from 'antd';
import { useState } from 'react';

import { ACTION_OPTIONS, DEFAULT_PAYLOAD_BY_ACTION } from '../constants';
import type { RunTaskOptions } from '../hooks/useDemo2Worker';
import type { WorkerAction } from '../types';

/**
 * TaskComposer 的对外接口
 *
 * 表单内部状态（action / payload）已内聚在组件内部，
 * 父组件只需提供 Worker 是否就绪，以及发起任务的回调即可。
 */
type TaskComposerProps = {
  /** Worker 是否已初始化完成，未就绪时禁用所有操作按钮 */
  isWorkerReady: boolean;
  /** 发起一个任务，由父组件（或 hook）负责实际调度逻辑 */
  runTask: (action: WorkerAction, options?: RunTaskOptions) => void;
};

/**
 * 任务发起面板
 *
 * 负责维护「选哪种任务 / 输什么参数」的表单状态，
 * 并在用户确认后调用 `runTask` 将请求交给上层处理。
 */
export const TaskComposer = ({ isWorkerReady, runTask }: TaskComposerProps) => {
  const [action, setAction] = useState<WorkerAction>('compute');
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD_BY_ACTION.compute);

  /** compute 任务使用时长参数；其余任务使用字符串 payload */
  const isCompute = action === 'compute';

  /** 仅当 Worker 就绪，且字符串类任务有非空输入时才可发起 */
  const canRun = isWorkerReady && (isCompute || payload.trim().length > 0);

  /** 切换任务类型时，同步重置 payload 为该类型的默认值 */
  const handleActionChange = (next: WorkerAction) => {
    setAction(next);
    setPayload(DEFAULT_PAYLOAD_BY_ACTION[next]);
  };

  /** 发起单个任务 */
  const handleRunTask = () => {
    if (isCompute) {
      runTask('compute');
    } else {
      runTask(action, { payload });
    }
  };

  /**
   * 并发发起 3 个 compute 任务
   * 演示同一 Worker 内多任务切片交替执行、主线程不阻塞
   */
  const handleRunConcurrent = () => {
    runTask('compute');
    runTask('compute');
    runTask('compute');
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="small">
      <Space wrap>
        {/* 选择任务类型 */}
        <Select
          style={{ width: 220 }}
          options={ACTION_OPTIONS}
          value={action}
          onChange={handleActionChange}
        />

        {/* compute 任务直接发起；其余任务输入字符串 payload */}
        {!isCompute && (
          <Input
            style={{ width: 360 }}
            value={payload}
            placeholder="输入任意字符串"
            onChange={(e) => setPayload(e.target.value)}
            onPressEnter={handleRunTask}
          />
        )}

        <Button type="primary" onClick={handleRunTask} disabled={!canRun}>
          发起任务
        </Button>

        {isCompute && (
          <Button onClick={handleRunConcurrent} disabled={!isWorkerReady}>
            并发发起 3 个
          </Button>
        )}
      </Space>

      {isCompute && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          并发任务会在同一个 Worker 线程中切片交替执行，主线程始终保持响应
        </Typography.Text>
      )}
    </Space>
  );
};
