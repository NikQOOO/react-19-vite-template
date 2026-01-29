import SparkMD5 from 'spark-md5';

// 类型定义
type WorkerMessageType = 'CALCULATE_HASH' | 'CREATE_CHUNKS';
type WorkerResponseType = 'HASH_PROGRESS' | 'CHUNKS_PROGRESS' | 'HASH_COMPLETE' | 'CHUNKS_CREATED' | 'ERROR';

interface WorkerOptions {
  hashChunkSize?: number; // 哈希计算分块大小
  reportInterval?: number; // 进度报告间隔（分片数）
}

interface WorkerMessage {
  type: WorkerMessageType;
  file?: File;
  chunkSize?: number;
  options?: WorkerOptions;
}

interface IUploadChunk {
  index: number;
  blob: Blob;
}

// 响应数据类型
interface HashProgressData {
  progress: number;
  samplingEnabled: boolean;
}

interface ChunksProgressData {
  progress: number;
}

interface HashCompleteData {
  hash: string;
}

interface ChunksCreatedData {
  chunks: IUploadChunk[];
}

interface ErrorData {
  error: string;
}

type WorkerResponseData = HashProgressData | ChunksProgressData | HashCompleteData | ChunksCreatedData | ErrorData;

/**
 * 发送消息到主线程
 */
function sendMessage<T extends WorkerResponseData>(type: WorkerResponseType, data: T) {
  self.postMessage({ type, ...data });
}

/**
 * 创建文件分片
 * @param file 要分片的文件
 * @param chunkSize 分片大小
 * @param reportInterval 报告进度的间隔
 */
function createChunks(file: File, chunkSize: number, reportInterval = 10): IUploadChunk[] {
  const totalChunks = Math.ceil(file.size / chunkSize);
  const chunks: IUploadChunk[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);

    chunks.push({
      index: i,
      blob: file.slice(start, end),
    });

    // 定期报告进度，无需考虑"释放主线程"
    if (i % reportInterval === 0 || i === totalChunks - 1) {
      sendMessage('CHUNKS_PROGRESS', {
        progress: Math.floor(((i + 1) / totalChunks) * 100),
      } as ChunksProgressData);
    }
  }

  return chunks;
}

/**
 * 处理文件分片创建
 */
function handleCreateChunks(file: File, chunkSize: number, options: WorkerOptions): void {
  const reportInterval = options.reportInterval || 10;
  const chunks = createChunks(file, chunkSize, reportInterval);
  sendMessage('CHUNKS_CREATED', { chunks } as ChunksCreatedData);
}

/**
 * 根据文件大小获取最佳哈希块大小
 */
function getOptimalHashChunkSize(fileSize: number): number {
  if (fileSize > 1024 * 1024 * 1024) return 8 * 1024 * 1024; // 大于1GB用8MB块
  if (fileSize > 100 * 1024 * 1024) return 4 * 1024 * 1024; // 大于100MB用4MB块
  return 2 * 1024 * 1024; // 默认2MB块
}

/**
 * 计算文件哈希值
 * @param file 要计算哈希的文件
 * @param chunkSize 每次读取的块大小
 */
async function calculateFileHash(file: File, chunkSize = 4 * 1024 * 1024): Promise<string> {
  const spark = new SparkMD5.ArrayBuffer();
  const fileReader = new FileReader();

  const chunks = Math.ceil(file.size / chunkSize);

  // 对于大文件使用采样算法加速哈希计算
  const useSampling = file.size > 1024 * 1024 * 1024; // 超过1GB启用采样
  const totalSamples = useSampling ? Math.min(100, chunks) : chunks; // 采样数量
  const samplingInterval = useSampling ? Math.floor(chunks / totalSamples) : 1; // 采样间隔
  const actualChunks = useSampling ? totalSamples : chunks; // 实际处理块数

  return new Promise<string>((resolve, reject) => {
    let currentChunk = 0;
    let processedChunks = 0;

    // 报告进度
    const reportProgress = () => {
      const progress = Math.floor((processedChunks / actualChunks) * 100);
      sendMessage('HASH_PROGRESS', { progress, samplingEnabled: useSampling } as HashProgressData);
    };

    // 处理下一个分块
    const loadNext = () => {
      // 采样模式下跳过部分块
      if (useSampling && currentChunk % samplingInterval !== 0 && currentChunk < chunks - 1) {
        currentChunk++;
        loadNext();
        return;
      }

      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);

      fileReader.onload = (e) => {
        if (e.target?.result) {
          spark.append(e.target.result as ArrayBuffer);
        }

        currentChunk++;
        processedChunks++;

        reportProgress();

        if (currentChunk < chunks) {
          // 使用setTimeout避免调用栈过深
          setTimeout(loadNext, 0);
        } else {
          const hash = spark.end();
          resolve(hash);
        }
      };

      fileReader.onerror = (error) => {
        reject(new Error(`文件读取错误: ${error.target?.error?.message || '未知错误'}`));
      };

      const blob = file.slice(start, end);
      fileReader.readAsArrayBuffer(blob);
    };

    // 延迟启动，让UI有时间响应
    setTimeout(loadNext, 50);
  });
}

/**
 * 处理文件哈希计算
 */
async function handleCalculateHash(file: File, options: WorkerOptions): Promise<void> {
  // 根据文件大小动态确定哈希块大小
  const hashChunkSize = options.hashChunkSize || getOptimalHashChunkSize(file.size);
  const hash = await calculateFileHash(file, hashChunkSize);
  sendMessage('HASH_COMPLETE', { hash } as HashCompleteData);
}

/**
 * 文件处理 Worker
 * 处理计算密集型任务，如文件哈希计算和分片创建
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, file, chunkSize, options = {} } = event.data;

  try {
    switch (type) {
      case 'CALCULATE_HASH':
        if (!file) throw new Error('文件不能为空');
        await handleCalculateHash(file, options);
        break;
      case 'CREATE_CHUNKS':
        if (!file || !chunkSize) throw new Error('文件或分片大小不能为空');
        handleCreateChunks(file, chunkSize, options);
        break;
      default:
        throw new Error(`未知操作类型: ${type as string}`);
    }
  } catch (error) {
    sendMessage('ERROR', {
      error: error instanceof Error ? error.message : '未知错误',
    } as ErrorData);
  }
};
