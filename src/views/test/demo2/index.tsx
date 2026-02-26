import { Card, Divider, Input, Space, Typography } from 'antd';

import { TaskComposer } from './components/TaskComposer';
import { TaskList } from './components/TaskList';
import { WorkerStatusBar } from './components/WorkerStatusBar';
import { useDemo2Worker } from './hooks/useDemo2Worker';

const Demo2 = () => {
  const { tasks, isWorkerReady, runTask, cancelTask, clearTasks } = useDemo2Worker();

  /** 当前处于 running 状态的任务数量，用于状态栏显示 */
  const runningCount = tasks.filter((t) => t.status === 'running').length;

  return (
    <div>
      <Typography.Title level={2}>Demo 2 - WorkerManager + 并发任务</Typography.Title>

      <WorkerStatusBar
        isWorkerReady={isWorkerReady}
        runningCount={runningCount}
        onClearTasks={clearTasks}
      />

      <Divider />

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 任务发起区：表单状态已内聚在 TaskComposer 内部 */}
        <Card size="small" title="发起任务">
          <TaskComposer isWorkerReady={isWorkerReady} runTask={runTask} />
        </Card>

        {/* 主线程响应性验证：Worker 运算期间输入框应始终可输入 */}
        <Card
          size="small"
          title="主线程响应性验证"
          extra={
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              在 Worker 运算期间，此输入框应始终流畅响应
            </Typography.Text>
          }
        >
          <Input placeholder="发起 Compute 任务后在此输入，验证主线程未被阻塞..." />
        </Card>

        {/* 运行中 & 历史任务列表 */}
        <Card size="small" title={`任务列表（${tasks.length}）`}>
          <TaskList tasks={tasks} onCancel={cancelTask} />
        </Card>
      </Space>
    </div>
  );
};

export default Demo2;
