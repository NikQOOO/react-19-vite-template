import { Card, Divider, Typography } from 'antd';

const Demo1 = () => {
  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={2}>Demo 1 - 创建一个简单的web worker</Typography.Title>
      <Divider />
      <Card title="Web Worker示例" bordered={false} style={{ width: 300 }}>
        123
      </Card>
    </div>
  );
};

export default Demo1;
