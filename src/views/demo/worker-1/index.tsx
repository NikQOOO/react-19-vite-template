import { Card, Col, Divider, Row, Tag, Typography } from 'antd';
import { useState } from 'react';

type WorkerToMainMsg = { type: 'ready' } | { type: 'done'; duration: number };

/** 对比演示用的任务时长 5 秒 */
const TASK_MS = 5_000;

/** 每个 Time Slice 分片占用主线程的预算 */
const FREAGMENT_BUDGET_MS = 20;

const DemoWorker1 = () => {
  const [duration, setDuration] = useState<number | null>(null);

  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={1}>WEB WORKER(1) 简单示例</Typography.Title>
      <Typography.Paragraph type="secondary">
        三种方式各执行约 {TASK_MS / 1_000}s 的 CPU 密集任务，对比对 UI 响应的影响。
        点击按钮后在下方输入框中尝试输入，感受主线程是否被阻塞。
      </Typography.Paragraph>
      <Divider />
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="1️⃣ 主线程中直接执行(同步)耗时任务" extra={<Tag color="red">阻塞主线程</Tag>}>
            123
          </Card>
        </Col>
        <Col span={12}>
          <Card title="2️⃣ 主线程中直接执行(同步)耗时任务，加上Time Slice" extra={<Tag color="orange-inverse">可以接受</Tag>}>
            123
          </Card>
        </Col>
        <Divider />
        <Col span={24}>3</Col>
      </Row>
    </div>
  );
};

export default DemoWorker1;
