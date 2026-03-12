import { Button, Card, Progress, Space, Tag, Typography } from 'antd';
import { memo } from 'react';

import { MSG_TYPE } from '../constants';

import type { WorkerToMainMessage } from '../typing';

interface IProps {
  data: WorkerToMainMessage[];
}

const MainLog: React.FC<IProps> = ({ data }) => {
  return (
    <Card title="主线程日志">
      <Space orientation="vertical" style={{ width: '100%' }}>
        {data.map((log) => {
          if (log.msgType === MSG_TYPE.READY) {
            return (
              <Space key={log.id}>
                <Tag color="green" variant="filled">
                  {log.msgType}
                </Tag>
              </Space>
            );
          } else if (log.msgType === MSG_TYPE.NORMAL_STRING) {
            return (
              <Space key={log.id}>
                <Tag color="magenta" variant="filled">
                  {log.msgType}
                </Tag>
                <Typography.Text>{log.payload}</Typography.Text>
                <Typography.Text code>{`耗时: ${log.duration}ms`}</Typography.Text>
              </Space>
            );
          } else if (log.msgType === MSG_TYPE.EXPENSIVE_COMPUTE) {
            return (
              <Space key={log.id}>
                <Tag color="volcano" variant="filled">
                  {log.msgType}
                </Tag>
                <Progress percent={log.progress} status="active" />
                <Button size="small" danger>
                  取消
                </Button>
                {log.duration !== undefined && (
                  <Typography.Text code>{`耗时: ${log.duration}ms`}</Typography.Text>
                )}
              </Space>
            );
          } else if (log.msgType === MSG_TYPE.EXPENSIVE_COMPUTE_BLOCKING) {
            return (
              <Space key={log.id}>
                <Tag color="blue" variant="filled">
                  {log.msgType}
                </Tag>
                <Progress percent={log.progress} status="active" />
                {log.duration !== undefined && (
                  <Typography.Text code>{`耗时: ${log.duration}ms`}</Typography.Text>
                )}
              </Space>
            );
          } else if (log.msgType === MSG_TYPE.ERROR) {
            return (
              <Space key={log.id}>
                <Tag color="red" variant="filled">
                  {log.msgType}
                </Tag>
                <Typography.Text>{log.payload}</Typography.Text>
                {log.duration !== undefined && (
                  <Typography.Text code>{`耗时: ${log.duration}ms`}</Typography.Text>
                )}
              </Space>
            );
          }
        })}
      </Space>
    </Card>
  );
};

export default memo(MainLog);
