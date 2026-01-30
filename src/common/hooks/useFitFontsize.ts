import { useMemo } from 'react';

interface IOptions {
  min?: number;
  max?: number;
  fontWeight?: number;
  fontFamily?: string;
}

// 默认字体族
const DEFAULT_FONT_FAMILY =
  'Noto Sans HK, Noto Sans, PingFang HK, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft JhengHei, Heiti TC, HelveticaNeue, Arial, sans-serif, AppleColor Emoji, Segoe UI Emoji';

// 默认配置
const DEFAULT_OPTIONS = {
  min: 12,
  max: 48,
  fontWeight: 400,
};

/**
 * 计算自适应字体大小
 * @param text - 文本内容
 * @param containerWidth - 容器宽度
 * @param opts - 配置项
 * @returns 计算出的字体大小
 */
export const calculateFitFontSize = (text: string | number, containerWidth: number, opts?: IOptions): number => {
  const { min, max, fontWeight } = { ...DEFAULT_OPTIONS, ...opts };
  // 获取body下的font-family
  const fontFamily = opts?.fontFamily || getComputedStyle(document.body).fontFamily || DEFAULT_FONT_FAMILY;
  const textContent = String(text).trim() || '0';

  // 创建 Canvas 上下文用于测量文本宽度
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return min;

  // 构建字体样式字符串
  const getFontStyle = (size: number) => `${fontWeight} ${size}px ${fontFamily}`;

  // 测量指定字体大小下的文本宽度
  const measureWidth = (fontSize: number) => {
    ctx.font = getFontStyle(fontSize);
    return ctx.measureText(textContent).width;
  };

  // 估算初始字体大小
  ctx.font = getFontStyle(1);
  const baseWidth = ctx.measureText(textContent).width || 1;
  // 增加預估值，優化二分查找搜索空間，避免二分查找過程中多次測量文本寬度
  const estimated = Math.floor(containerWidth / baseWidth);

  // 二分查找范围
  let left = min;
  let right = Math.min(max, Math.max(min, estimated + 4));

  // 边界情况处理
  if (measureWidth(min) > containerWidth) return min;
  if (measureWidth(right) <= containerWidth) return right;

  // 二分查找最大可用字体大小
  let result = min;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (measureWidth(mid) <= containerWidth) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
};

/**
 * 自适应字体大小
 * @param text - 文本内容
 * @param containerWidth - 容器宽度
 * @param opts - 配置项
 * @returns 计算出的字体大小
 */
const useFitFontsize = (text: string | number, containerWidth: number, opts?: IOptions): number => {
  return useMemo(() => calculateFitFontSize(text, containerWidth, opts), [text, containerWidth, opts]);
};

export default useFitFontsize;
