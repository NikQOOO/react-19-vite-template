import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { formatBytes, formatTime, MODE_INFO } from '../constants';
import type { BenchmarkRound } from '../hooks/useDemo3Worker';

type BenchmarkTableProps = {
  benchmarks: BenchmarkRound[];
};

/**
 * 表格列定义
 *
 * 将 Clone 和 Transfer 的结果并排展示，核心对比维度：
 *  - 往返耗时（roundTrip）：含 postMessage 序列化 + Worker 计算 + 返回
 *  - 传输开销：roundTrip - processTime，纯 postMessage 的拷贝开销
 *  - 加速比：Clone 传输开销 / Transfer 传输开销
 *  - buffer 发送后状态：clone 保持原大小，transfer 变为 0（已 detach）
 */

type FlatRow = {
  key: number;
  bufferSize: number;
  cloneRoundTrip: string;
  cloneOverhead: string;
  transferRoundTrip: string;
  transferOverhead: string;
  cloneBufferAfter: string;
  transferBufferAfter: string;
  speedup: string;
};

const columns: ColumnsType<FlatRow> = [
  {
    title: '数据大小',
    dataIndex: 'bufferSize',
    width: 100,
    render: (v: number) => formatBytes(v),
  },
  {
    title: 'Clone 往返',
    dataIndex: 'cloneRoundTrip',
    width: 120,
  },
  {
    title: 'Transfer 往返',
    dataIndex: 'transferRoundTrip',
    width: 120,
  },
  {
    title: '传输开销对比',
    children: [
      {
        title: `${MODE_INFO.clone.label}`,
        dataIndex: 'cloneOverhead',
        width: 120,
      },
      {
        title: `${MODE_INFO.transfer.label}`,
        dataIndex: 'transferOverhead',
        width: 120,
      },
    ],
  },
  {
    title: '加速比',
    dataIndex: 'speedup',
    width: 100,
    render: (v: string) => <Tag color="blue">{v}</Tag>,
  },
  {
    title: '发送后 buffer',
    children: [
      {
        title: 'Clone 侧',
        dataIndex: 'cloneBufferAfter',
        width: 100,
        render: (v: string) => <Tag color="green">{v}</Tag>,
      },
      {
        title: 'Transfer 侧',
        dataIndex: 'transferBufferAfter',
        width: 100,
        render: (v: string) => (
          <Tag color={v === '0 bytes (detached)' ? 'orange' : 'green'}>{v}</Tag>
        ),
      },
    ],
  },
];

/**
 * 基准测试结果表
 *
 * 以表格形式直观对比每轮测试中 Clone 和 Transfer 的性能指标。
 * 重点突出「传输开销」——即 roundTrip 减去 processTime 后的差值，
 * 这部分纯粹是 postMessage 的序列化/拷贝消耗，是两种模式的核心差异所在。
 */
export const BenchmarkTable = ({ benchmarks }: BenchmarkTableProps) => {
  if (benchmarks.length === 0) {
    return (
      <Typography.Text type="secondary">暂无测试数据，点击「运行对比测试」开始。</Typography.Text>
    );
  }

  const dataSource: FlatRow[] = [...benchmarks].reverse().map((round) => {
    const c = round.clone;
    const t = round.transfer;
    const cOverhead = c ? c.roundTrip - c.processTime : 0;
    const tOverhead = t ? t.roundTrip - t.processTime : 0;

    return {
      key: round.id,
      bufferSize: round.bufferSize,
      cloneRoundTrip: c ? formatTime(c.roundTrip) : '-',
      cloneOverhead: c ? formatTime(cOverhead) : '-',
      transferRoundTrip: t ? formatTime(t.roundTrip) : '-',
      transferOverhead: t ? formatTime(tOverhead) : '-',
      speedup: cOverhead > 0 && tOverhead > 0 ? `${(cOverhead / tOverhead).toFixed(1)}x` : '-',
      cloneBufferAfter: c ? formatBytes(c.bufferAfterSend) : '-',
      transferBufferAfter: t
        ? t.bufferAfterSend === 0
          ? '0 bytes (detached)'
          : formatBytes(t.bufferAfterSend)
        : '-',
    };
  });

  return (
    <Table<FlatRow>
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      size="small"
      bordered
      scroll={{ x: 900 }}
    />
  );
};
