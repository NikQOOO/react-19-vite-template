import { Button, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';

import { SIZE_PRESETS } from '../constants';

type BenchmarkControlProps = {
  isWorkerReady: boolean;
  isRunning: boolean;
  onRun: (bufferSize: number) => void;
  onClear: () => void;
};

/**
 * 基准测试控制面板
 *
 * 选择 buffer 大小后一键触发 Clone vs Transfer 对比测试。
 */
export const BenchmarkControl = ({
  isWorkerReady,
  isRunning,
  onRun,
  onClear,
}: BenchmarkControlProps) => {
  const [selectedSize, setSelectedSize] = useState(SIZE_PRESETS[1].value);

  return (
    <Space wrap>
      <Tag color={isWorkerReady ? 'green' : 'red'}>
        {isWorkerReady ? 'Worker Ready' : 'Worker Stopped'}
      </Tag>

      <Select
        style={{ width: 140 }}
        value={selectedSize}
        onChange={setSelectedSize}
        options={SIZE_PRESETS.map((p) => ({ label: p.label, value: p.value }))}
      />

      <Button
        type="primary"
        loading={isRunning}
        disabled={!isWorkerReady}
        onClick={() => onRun(selectedSize)}
      >
        {isRunning ? '测试中…' : '运行对比测试'}
      </Button>

      <Button size="small" onClick={onClear}>
        清空记录
      </Button>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        每次测试将依次用 Clone 和 Transfer 发送相同大小的随机数据
      </Typography.Text>
    </Space>
  );
};
