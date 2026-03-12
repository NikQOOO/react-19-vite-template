import { Card, Space, Tag, Typography } from 'antd';
import { memo } from 'react';

import { MSG_TYPE } from '../constants';
import type { MainToWorkerMessage } from '../typing';

interface IProps {
  data: MainToWorkerMessage[];
}

const WorkerLog: React.FC<IProps> = ({ data }) => {
  return (
    <Card title="Worker日志">
      <Space orientation="vertical" style={{ width: '100%' }}>
        {data.map((log) => {
          if (log.msgType === MSG_TYPE.NORMAL_STRING) {
            return (
              <Space key={log.id}>
                <Tag color="magenta" variant="filled">
                  {log.msgType}
                </Tag>
                <Typography.Text>{log.payload}</Typography.Text>
              </Space>
            );
          } else if (log.msgType === MSG_TYPE.EXPENSIVE_COMPUTE) {
            return (
              <Space key={log.id}>
                <Tag color="volcano" variant="filled">
                  {log.msgType}
                </Tag>
                <Typography.Text>Count: {log.taskCount}</Typography.Text>
              </Space>
            );
          } else if (log.msgType === MSG_TYPE.EXPENSIVE_COMPUTE_BLOCKING) {
            return (
              <Space key={log.id}>
                <Tag color="blue" variant="filled">
                  {log.msgType}
                </Tag>
                <Typography.Text>Count: {log.taskCount}</Typography.Text>
              </Space>
            );
          }
        })}
      </Space>
    </Card>
  );
};

export default memo(WorkerLog);
