import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';

interface IWorkerToMain {
  msgType: (typeof MSG_TYPE)[keyof typeof MSG_TYPE];
  content: string;
  /** 0-100，针对 EXPENSIVE_COMPUTE 类型的日志 */
  progress?: number;
}

interface IMainToWorker {
  msgType: (typeof MSG_TYPE)[keyof typeof MSG_TYPE];
  content: string;
  /** 0-100，针对 EXPENSIVE_COMPUTE 类型的日志 */
  progress?: number;
}

const MSG_TYPE = {
  NORMAL_STRING: 0,
  EXPENSIVE_COMPUTE: 1,
  CONCURRENT_TASK: 2,
};

const DemoWorker2 = () => {
  const [workerReady, setWorkerReady] = useState(false);

  const [msgType, setMsgType] = useState(MSG_TYPE.NORMAL_STRING);
  const [message, setMessage] = useState('');

  const [mainThreadLogs, setMainThreadLogs] = useState<IWorkerToMain[]>([]);
  const [workerLogs, setWorkerLogs] = useState<IMainToWorker[]>([]);

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
                    label: 'CPU 密集型计算',
                    value: MSG_TYPE.EXPENSIVE_COMPUTE,
                  },
                  {
                    label: '并发任务示例',
                    value: MSG_TYPE.CONCURRENT_TASK,
                  },
                ]}
                style={{ width: 150 }}
                value={msgType}
                onChange={(value) => setMsgType(value)}
              />
              {msgType === MSG_TYPE.NORMAL_STRING && (
                <>
                  <Input
                    placeholder="输入要发送给 Worker 的字符串"
                    style={{ width: 300 }}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button type="primary">发送</Button>
                </>
              )}
              {msgType === MSG_TYPE.EXPENSIVE_COMPUTE && <Button type="primary">开始</Button>}
              {msgType === MSG_TYPE.CONCURRENT_TASK && (
                <>
                  <Button type="primary">开始</Button>
                  <Button type="primary" ghost>
                    开始多任务
                  </Button>
                </>
              )}
              <Button>清除日志</Button>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="主线程响应性验证">
            <Input placeholder="Worker 处理消息时此输入框应保持流畅..." />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="主线程日志">
            <Space orientation="vertical" style={{ width: '100%' }}>
              {mainThreadLogs.map((log, index) => {
                if (log.msgType === MSG_TYPE.NORMAL_STRING) {
                  return (
                    <Typography.Text key={index}>
                      {log.content}
                      <br />
                    </Typography.Text>
                  );
                } else if (log.msgType === MSG_TYPE.EXPENSIVE_COMPUTE) {
                  return <Progress key={index} percent={log.progress} status="active" />;
                } else if (log.msgType === MSG_TYPE.CONCURRENT_TASK) {
                  return (
                    <Typography.Text key={index}>
                      {log.content}
                      <br />
                    </Typography.Text>
                  );
                }
              })}
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Worker日志">
            <Space orientation="vertical" style={{ width: '100%' }}>
              {mainThreadLogs.map((log, index) => {
                if (log.msgType === MSG_TYPE.NORMAL_STRING) {
                  return (
                    <Typography.Text key={index}>
                      {log.content}
                      <br />
                    </Typography.Text>
                  );
                } else if (log.msgType === MSG_TYPE.EXPENSIVE_COMPUTE) {
                  return <Progress key={index} percent={log.progress} status="active" />;
                } else if (log.msgType === MSG_TYPE.CONCURRENT_TASK) {
                  return (
                    <Typography.Text key={index}>
                      {log.content}
                      <br />
                    </Typography.Text>
                  );
                }
              })}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DemoWorker2;
