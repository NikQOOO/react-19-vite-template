import { Button, Space, Tag } from 'antd';

/**
 * WorkerStatusBar 的对外接口
 */
type WorkerStatusBarProps = {
  /** Worker 线程是否已就绪，决定状态标签颜色与文案 */
  isWorkerReady: boolean;
  /** 当前处于 running 状态的任务数量，大于 0 时显示蓝色计数标签 */
  runningCount: number;
  /** 清空已完成 / 已取消 / 错误任务，保留运行中的任务 */
  onClearTasks: () => void;
};

/**
 * Worker 状态栏
 *
 * 显示当前 Worker 的运行状态、正在执行的任务数，
 * 以及清空历史任务的快捷操作。
 */
export const WorkerStatusBar = ({
  isWorkerReady,
  runningCount,
  onClearTasks,
}: WorkerStatusBarProps) => {
  return (
    <Space style={{ marginBottom: 8 }}>
      {/* Worker 是否就绪：绿色=正常，红色=未启动/已终止 */}
      <Tag color={isWorkerReady ? 'green' : 'red'}>
        {isWorkerReady ? 'Worker Ready' : 'Worker Stopped'}
      </Tag>

      {/* 有运行中的任务时显示计数 */}
      {runningCount > 0 && <Tag color="blue">{runningCount} 个任务运行中</Tag>}

      <Button size="small" onClick={onClearTasks}>
        清空已完成
      </Button>
    </Space>
  );
};
