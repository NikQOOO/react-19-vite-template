import { Typography } from 'antd';

const DemoWorker2 = () => {
  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={2}>
        WEB WORKER(2) worker + hook + manager + 并发任务
      </Typography.Title>
      <Typography.Paragraph>
        这个示例展示了一个更完整的 Worker 使用方案，包含了 WorkerManager、hook
        封装，以及并发任务管理等功能。
      </Typography.Paragraph>
    </div>
  );
};

export default DemoWorker2;
