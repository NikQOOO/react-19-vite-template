import { Button, Progress, Space, Tag, Typography } from 'antd';

import type { TaskEntry } from '../hooks/useDemo2Worker';

type TaskListProps = {
  tasks: TaskEntry[];
  onCancel: (id: number) => void;
};

const STATUS_LABEL: Record<TaskEntry['status'], string> = {
  running: '运行中',
  done: '完成',
  cancelled: '已取消',
  error: '错误',
};

const statusType = (s: TaskEntry['status']) =>
  s === 'done' ? 'success' : s === 'error' ? 'danger' : 'secondary';

/** 运行中任务的中间列：compute 显示进度条，blocking 显示不可中断标签，其余留空 */
const RunningIndicator = ({ task }: { task: TaskEntry }) => {
  if (task.action === 'compute') {
    return (
      <Progress
        percent={Math.round(task.progress)}
        size="small"
        style={{ width: 200, margin: 0 }}
      />
    );
  }
  if (task.action === 'blocking') {
    return <Tag color="orange">执行中（不可中断）</Tag>;
  }
  return null;
};

export const TaskList = ({ tasks, onCancel }: TaskListProps) => {
  if (tasks.length === 0) {
    return <Typography.Text type="secondary">暂无任务，发起后显示在此。</Typography.Text>;
  }

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size={4}>
      {[...tasks].reverse().map((task) => (
        <Space key={task.id} style={{ width: '100%' }} wrap>
          <Typography.Text
            type={statusType(task.status)}
            style={{ width: 52, display: 'inline-block' }}
          >
            [{STATUS_LABEL[task.status]}]
          </Typography.Text>

          <Typography.Text code style={{ minWidth: 180 }}>
            {task.label}
          </Typography.Text>

          {task.status === 'running' ? (
            <RunningIndicator task={task} />
          ) : (
            <Typography.Text type="secondary">
              {task.result || (task.status === 'done' ? 'done' : '')}
            </Typography.Text>
          )}

          {task.status === 'done' && (
            <Typography.Text type="secondary">{task.duration}ms</Typography.Text>
          )}

          {task.status === 'running' && task.action === 'compute' && (
            <Button size="small" danger onClick={() => onCancel(task.id)}>
              取消
            </Button>
          )}
        </Space>
      ))}
    </Space>
  );
};
