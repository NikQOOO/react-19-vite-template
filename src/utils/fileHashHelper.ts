import SparkMD5 from 'spark-md5';

/**
 * 文件哈希计算选项
 */
export interface HashOptions {
  hashChunkSize?: number; // 用于哈希计算的分片大小，默认2MB
  onProgress?: (progress: number) => void; // 进度回调函数
}

/**
 * 在主线程中计算文件MD5哈希
 * 注意：大文件计算可能会阻塞主线程
 */
export async function calculateFileHashSync(file: File, options: HashOptions = {}): Promise<string> {
  const { hashChunkSize = 2 * 1024 * 1024, onProgress } = options;

  const spark = new SparkMD5.ArrayBuffer();
  const chunks = Math.ceil(file.size / hashChunkSize);
  let currentChunk = 0;

  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      if (e.target?.result) {
        spark.append(e.target.result as ArrayBuffer);
        currentChunk++;

        // 报告进度
        if (onProgress) {
          onProgress((currentChunk / chunks) * 100);
        }

        // 继续读取下一块
        if (currentChunk < chunks) {
          loadNext();
        } else {
          // 完成计算
          const hash = spark.end();
          resolve(hash);
        }
      }
    };

    fileReader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    function loadNext() {
      const start = currentChunk * hashChunkSize;
      const end = Math.min(start + hashChunkSize, file.size);
      const blob = file.slice(start, end);
      fileReader.readAsArrayBuffer(blob);
    }

    // 开始读取第一块
    loadNext();
  });
}

/**
 * 创建文件分片
 */
export interface FileChunk {
  index: number;
  blob: Blob;
}

export interface ChunkOptions {
  onProgress?: (progress: number) => void; // 进度回调函数
}

/**
 * 在主线程中创建文件分片
 */
export function createFileChunksSync(file: File, chunkSize: number, options: ChunkOptions = {}): FileChunk[] {
  const { onProgress } = options;
  const chunks: FileChunk[] = [];
  const totalChunks = Math.ceil(file.size / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const blob = file.slice(start, end);

    chunks.push({
      index: i,
      blob,
    });

    // 报告进度
    if (onProgress) {
      onProgress(((i + 1) / totalChunks) * 100);
    }
  }

  return chunks;
}
