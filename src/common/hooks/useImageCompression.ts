import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

export interface CompressionResult {
  file: File;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  timeTakenSec: number;
}

// 根据文件大小动态生成压缩选项
const getCompressionOptions = (file: File): CompressionOptions => {
  const sizeMB = file.size / 1024 / 1024;

  // 小文件：不限制尺寸，保持清晰度
  if (sizeMB < 3) {
    return { maxSizeMB: 1.5 };
  }

  // 中等文件：轻微限制
  if (sizeMB < 8) {
    return { maxSizeMB: 1.5, maxWidthOrHeight: 2560 };
  }

  // 大文件：强限制
  return { maxSizeMB: 1.5, maxWidthOrHeight: 1920 };
};

/** 用于压缩图片文件至 1.5MB 以下 */
const useImageCompression = () => {
  const compressImage = async (file: File): Promise<CompressionResult | null> => {
    if (!file) return null;

    const startTime = performance.now();

    if (file.size / 1024 / 1024 < 1.5) {
      return {
        file,
        compressed: false,
        originalSize: file.size,
        compressedSize: file.size,
        timeTakenSec: performance.now() - startTime,
      };
    }

    const options = getCompressionOptions(file);
    const compressionFile = await imageCompression(file, {
      ...options,
      useWebWorker: true, // 使用 Web Worker 进行压缩，避免阻塞主线程
    });

    return {
      file: compressionFile,
      compressed: true,
      originalSize: file.size,
      compressedSize: compressionFile.size,
      timeTakenSec: performance.now() - startTime,
    };
  };
  return { compressImage };
};

export default useImageCompression;
