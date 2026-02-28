import { Space, Tag, Timeline, Typography } from 'antd';

import { formatBytes, formatTime, MODE_INFO } from '../constants';
import type { TransferLog } from '../hooks/useDemo3Worker';

type TransferLogListProps = {
  logs: TransferLog[];
};

/**
 * 传输日志时间线
 *
 * 以时间线形式展示每一次 postMessage 的详细信息，
 * 帮助学习者直观理解两种模式在每次操作中的具体差异。
 */
export const TransferLogList = ({ logs }: TransferLogListProps) => {
  if (logs.length === 0) {
    return <Typography.Text type="secondary">暂无传输日志。</Typography.Text>;
  }

  return (
    <Timeline
      items={[...logs].reverse().map((log) => ({
        color: log.error ? 'red' : log.mode === 'transfer' ? 'blue' : 'green',
        children: (
          <Space direction="vertical" size={0}>
            <Space size="small">
              <Tag color={log.mode === 'transfer' ? 'blue' : 'green'}>
                {MODE_INFO[log.mode].label}
              </Tag>
              <Typography.Text strong>{formatBytes(log.bufferSize)}</Typography.Text>
            </Space>

            {log.error ? (
              <Typography.Text type="danger">{log.error}</Typography.Text>
            ) : log.result ? (
              <Space size="middle" wrap>
                <Typography.Text type="secondary">
                  往返: {formatTime(log.result.roundTrip)}
                </Typography.Text>
                <Typography.Text type="secondary">
                  计算: {formatTime(log.result.processTime)}
                </Typography.Text>
                <Typography.Text type="secondary">
                  传输开销: {formatTime(log.result.roundTrip - log.result.processTime)}
                </Typography.Text>

                {/* ⭐ 教学核心：transfer 后 buffer 被 detach */}
                {log.mode === 'transfer' ? (
                  <Tag color="orange">
                    发送后 buffer = {log.result.bufferAfterSend} bytes
                    {log.result.bufferAfterSend === 0 && ' (detached ✓)'}
                  </Tag>
                ) : (
                  <Tag color="green">
                    发送后 buffer = {formatBytes(log.result.bufferAfterSend)} (仍可用 ✓)
                  </Tag>
                )}
              </Space>
            ) : null}
          </Space>
        ),
      }))}
    />
  );
};
