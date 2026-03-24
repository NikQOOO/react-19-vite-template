import { Button, Card, Col, Divider, Input, Row, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
// components
import MainLog from './components/MainLog';
import WorkerLog from './components/WorkerLog';
// hooks
import useWorker from './hooks/useWorker';
// constant
import { MSG_TYPE } from './constants';
// typing
import type { ActionableMessageType } from './typing';

const DemoWorker2 = () => {
  const { workerReady, mainThreadLogs, workerLogs } = useWorker();

  const [msgType, setMsgType] = useState<ActionableMessageType>(MSG_TYPE.NORMAL_STRING);
  const [message, setMessage] = useState('');

  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={2}>
        WEB WORKER(2) worker + hook + manager + 并发任务
      </Typography.Title>
      <Typography.Paragraph>
        这个示例展示了一个更完整的 Worker 使用方案，包含了 WorkerManager、hook
        封装，以及并发任务管理等功能。
      </Typography.Paragraph>
      <Divider />
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            title="控制台"
            extra={
              <Tag color={workerReady ? 'green' : 'red'}>
                {workerReady ? 'Worker 已就绪' : 'Worker 未就绪'}
              </Tag>
            }
          >
            <Space>
              <Select
                options={[
                  {
                    label: '普通字符串',
                    value: MSG_TYPE.NORMAL_STRING,
                  },
                  {
                    label: 'CPU 密集型计算（可切片）',
                    value: MSG_TYPE.EXPENSIVE_COMPUTE,
                  },
                  {
                    label: 'CPU 密集型计算（不可切片）',
                    value: MSG_TYPE.EXPENSIVE_COMPUTE_BLOCKING,
                  },
                ]}
                style={{ width: 230 }}
                value={msgType}
                onChange={(value) => setMsgType(value)}
              />
              {msgType === MSG_TYPE.NORMAL_STRING && (
                <>
                  <Input
                    placeholder="输入要发送给 Worker 的字符串"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button type="primary">发送</Button>
                </>
              )}
              {msgType === MSG_TYPE.EXPENSIVE_COMPUTE && (
                <>
                  <Button type="primary">开始</Button>
                  <Button type="primary" ghost>
                    开始3个（并发）
                  </Button>
                </>
              )}
              {msgType === MSG_TYPE.EXPENSIVE_COMPUTE_BLOCKING && (
                <>
                  <Button type="primary">开始</Button>
                  <Button type="primary" ghost>
                    开始3个（并发）
                  </Button>
                </>
              )}
              <Button>清除日志</Button>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="主线程响应性验证"
            extra={
              <Typography.Text type="secondary">
                Worker 运算期间此输入框应始终可输入
              </Typography.Text>
            }
          >
            <Input placeholder="尝试输入，验证主线程响应性" />
          </Card>
        </Col>
        <Col span={12}>
          <MainLog data={mainThreadLogs} />
        </Col>
        <Col span={12}>
          <WorkerLog data={workerLogs} />
        </Col>
      </Row>
    </div>
  );
};

export default DemoWorker2;
