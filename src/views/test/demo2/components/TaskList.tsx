import { Button, Progress, Space, Typography } from 'antd';

import type { TaskEntry } from '../hooks/useDemo2Worker';

/**
 * TaskList 的对外接口
 */
type TaskListProps = {
  /** 所有任务条目（包含运行中、已完成、已取消、错误） */
  tasks: TaskEntry[];
  /** 取消指定 UI 任务 id 对应的运行中任务 */
  onCancel: (id: number) => void;
};

/** 任务状态 → 中文标签映射，用于列表行左侧显示 */
const statusLabel: Record<TaskEntry['status'], string> = {
  running: '运行中',
  done: '完成',
  cancelled: '已取消',
  error: '错误',
};

/**
 * 任务列表
 *
 * 以倒序（最新在前）展示所有任务条目，
 * 每行包含：状态标签 / 任务名 / 进度条或结果文本 / 耗时 / 取消按钮。
 */
export const TaskList = ({ tasks, onCancel }: TaskListProps) => {
  if (tasks.length === 0) {
    return <Typography.Text type="secondary">暂无任务，发起后显示在此。</Typography.Text>;
  }

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size={4}>
      {/* 倒序排列，最新发起的任务显示在最前 */}
      {[...tasks].reverse().map((task) => (
        <Space key={task.id} style={{ width: '100%' }} wrap>
          {/* 状态标签：done=绿色 / error=红色 / 其余=灰色 */}
          <Typography.Text
            type={
              task.status === 'done' ? 'success' : task.status === 'error' ? 'danger' : 'secondary'
            }
            style={{ width: 52, display: 'inline-block' }}
          >
            [{statusLabel[task.status]}]
          </Typography.Text>

          {/* 任务描述名称 */}
          <Typography.Text code style={{ minWidth: 140 }}>
            {task.label}
          </Typography.Text>

          {/*
           * compute 任务运行中 → 显示进度条
           * 其他情况 → 显示结果文本（完成但无结果时兜底显示 'done'）
           */}
          {task.status === 'running' && task.action === 'compute' ? (
            <Progress
              percent={Math.round(task.progress)}
              size="small"
              style={{ width: 200, margin: 0 }}
            />
          ) : (
            <Typography.Text type="secondary">
              {task.result || (task.status === 'done' ? 'done' : '')}
            </Typography.Text>
          )}

          {/* 任务完成后显示总耗时 */}
          {task.status === 'done' && (
            <Typography.Text type="secondary">{task.duration}ms</Typography.Text>
          )}

          {/* 仅对运行中的 compute 任务提供软取消操作 */}
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
