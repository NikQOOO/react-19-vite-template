import type { TransferMode } from './types';

// ─── Buffer 大小预设 ───────────────────────────────────────────────────────────

export const SIZE_PRESETS = [
  { label: '1 MB', value: 1 * 1024 * 1024 },
  { label: '10 MB', value: 10 * 1024 * 1024 },
  { label: '50 MB', value: 50 * 1024 * 1024 },
  { label: '100 MB', value: 100 * 1024 * 1024 },
];

// ─── 模式描述 ──────────────────────────────────────────────────────────────────

export const MODE_INFO: Record<TransferMode, { label: string; description: string }> = {
  clone: {
    label: 'Structured Clone',
    description: '序列化 → 复制 → 反序列化（数据存在两份拷贝）',
  },
  transfer: {
    label: 'Transferable',
    description: '零拷贝转移所有权（内存仅一份，发送方失去访问权）',
  },
};

// ─── 格式化工具 ────────────────────────────────────────────────────────────────

/** 毫秒时间格式化，根据数量级自动选择精度 */
export const formatTime = (ms: number): string => {
  if (ms < 0.01) return '< 0.01 ms';
  if (ms < 1) return `${ms.toFixed(3)} ms`;
  if (ms < 100) return `${ms.toFixed(2)} ms`;
  return `${ms.toFixed(1)} ms`;
};

/** 字节数格式化 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 bytes';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} bytes`;
};
