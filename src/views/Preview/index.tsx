import { useCallback, useRef, useState } from 'react';

import { request } from '@/services/request';
import { calculateFileHashSync, createFileChunksSync } from '@/utils/fileHashHelper';

import FileInfo from './FileInfo';
import ProgressBar from './ProgressBar';

import styles from './index.module.css';

/**
 * 配置常量
 */
const CONFIG = {
  CHUNK_SIZE: 4 * 1024 * 1024, // 每个分片大小为4MB
  CONCURRENCY: 4, // 并发上传分片数量
  MAX_RETRIES: 3, // 单个分片上传失败后的最大重试次数
};

/**
 * 上传分片接口
 */
interface IUploadChunk {
  index: number;
  blob: Blob;
}

/**
 * 文件上传组件（主线程版本 - 不使用Web Worker）
 * 支持分片上传、断点续传、并发控制、进度跟踪
 * 注意：大文件处理会在主线程执行，可能导致页面暂时无响应
 */
const PreviewPage: React.FC = () => {
  // 状态管理
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);
  const [hashProgress, setHashProgress] = useState(0);
  const [chunksProgress, setChunksProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const uploadingRef = useRef(false); // 防止重复上传

  /**
   * 处理文件选择事件
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadProgress(0);
    setHashProgress(0);
    setChunksProgress(0);
    setStatusMessage('');
    setIsProcessing(false);
    uploadingRef.current = false;

    // 设置文件信息用于显示
    if (selectedFile) {
      setFileInfo({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      });
    } else {
      setFileInfo(null);
    }
  }, []);

  /**
   * 上传单个分片
   */
  const uploadChunk = useCallback(
    async (
      chunk: IUploadChunk,
      fileHash: string,
      fileName: string,
      chunkLoaded: number[],
      updateProgress: (diff: number) => void,
      attempt: number = 1,
    ): Promise<void> => {
      const { index, blob } = chunk;
      const formData = new FormData();
      formData.append('chunk', blob);
      formData.append('fileHash', fileHash);
      formData.append('chunkIndex', String(index));
      formData.append('fileName', fileName);

      try {
        const uploadRst = await request<API.IRestInfo>('/api/file/upload', {
          method: 'POST',
          data: formData,
          headers: {
            'X-File-Hash': fileHash,
            'X-Chunk-Index': String(index),
          },
          withCredentials: true,
          onUploadProgress: (event) => {
            // HTTP 进度事件会多次触发，需要计算每次的增量
            const currentLoaded = event.loaded;
            const prevLoaded = chunkLoaded[index] || 0;
            const increment = currentLoaded - prevLoaded;

            if (increment > 0) {
              updateProgress(increment);
              chunkLoaded[index] = currentLoaded;
            }
          },
        });

        if (uploadRst.code !== 0) {
          throw new Error(uploadRst.msg);
        }

        // 确保计算正确的完成字节数
        const finalDiff = blob.size - chunkLoaded[index];
        if (finalDiff > 0) {
          updateProgress(finalDiff);
        }
        chunkLoaded[index] = blob.size;
      } catch (err) {
        console.error(`分片 ${index} 上传失败, 尝试次数: ${attempt}`, err);

        if (attempt < CONFIG.MAX_RETRIES) {
          // 重试当前分片
          await uploadChunk(chunk, fileHash, fileName, chunkLoaded, updateProgress, attempt + 1);
        } else {
          throw new Error(`分片 ${index} 上传失败，已重试${attempt}次`);
        }
      }
    },
    [],
  );

  /**
   * 并发控制上传分片
   */
  const uploadChunksWithConcurrency = useCallback(
    async (
      chunks: IUploadChunk[],
      fileHash: string,
      fileName: string,
      chunkLoaded: number[],
      updateProgress: (diff: number) => void,
    ): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        let currentIndex = 0;
        let activeCount = 0;
        let completedCount = 0;

        // 声明scheduleNext函数
        let scheduleNext: () => void = () => {};

        // 创建内部函数来处理单个分片的上传
        function processChunk(chunk: IUploadChunk) {
          activeCount++;

          // 显示当前进度状态
          setStatusMessage(`正在上传第 ${chunk.index + 1}/${chunks.length} 个分片...`);

          // 上传当前分片
          uploadChunk(chunk, fileHash, fileName, chunkLoaded, updateProgress)
            .then(() => {
              activeCount--;
              completedCount++;
              // 更新状态，显示完成进度
              setStatusMessage(`已完成 ${completedCount}/${chunks.length} 个分片上传`);
              // 调度下一个分片
              scheduleNext();
              return true;
            })
            .catch((error) => {
              reject(error instanceof Error ? error : new Error(String(error)));
            });
        }

        // 定义调度下一个分片上传的函数
        scheduleNext = () => {
          // 所有分片上传完成
          if (completedCount === chunks.length) {
            resolve();
            return;
          }

          // 在并发限制内启动新的上传任务
          while (activeCount < CONFIG.CONCURRENCY && currentIndex < chunks.length) {
            processChunk(chunks[currentIndex++]);
          }
        };

        // 开始调度上传
        scheduleNext();
      });
    },
    [uploadChunk],
  );

  /**
   * 处理文件上传的主函数
   */
  const handleUpload = useCallback(async () => {
    if (!file || uploadingRef.current) {
      return;
    }

    uploadingRef.current = true;
    setStatusMessage('上传准备中...');
    setIsProcessing(true);

    try {
      // 1. 在主线程计算文件哈希
      setStatusMessage('计算文件哈希...');
      setHashProgress(0);

      // 根据文件大小优化哈希计算
      let hashChunkSize = 2 * 1024 * 1024; // 默认2MB

      if (file.size > 1024 * 1024 * 1024) {
        // 如果文件大于1GB
        hashChunkSize = 8 * 1024 * 1024; // 使用8MB分片
      } else if (file.size > 100 * 1024 * 1024) {
        // 如果文件大于100MB
        hashChunkSize = 4 * 1024 * 1024; // 使用4MB分片
      }

      const fileHash = await calculateFileHashSync(file, {
        hashChunkSize,
        onProgress: (progress) => {
          setHashProgress(progress);
        },
      });

      setHashProgress(100);
      setIsProcessing(false);

      // 2. 获取已上传的分片索引列表（断点续传）
      type CheckResponseType = {
        fileExists: boolean;
        uploadedChunks: number[];
      };

      const checkResponse = await request<API.IRestModal<CheckResponseType>>('/api/file/check', {
        method: 'GET',
        params: {
          fileHash,
          fileName: file.name,
        },
      });

      if (checkResponse.code !== 0) {
        setStatusMessage(String(checkResponse.msg));
        return;
      }

      if (checkResponse.data.fileExists) {
        setStatusMessage('文件已存在，请勿重复上传');
        setUploadProgress(100);
        return;
      }

      const uploadedChunks: number[] = checkResponse.data.uploadedChunks || [];

      // 3. 在主线程创建文件分片
      setStatusMessage('准备文件分片...');
      setChunksProgress(0);
      setIsProcessing(true);

      const chunks = createFileChunksSync(file, CONFIG.CHUNK_SIZE, {
        onProgress: (progress) => {
          setChunksProgress(progress);
        },
      });

      const totalChunks = chunks.length;
      setChunksProgress(100);
      setIsProcessing(false);

      console.log(`文件总分片数: ${totalChunks}，已上传: ${uploadedChunks.toString()}`);

      // 4. 过滤出尚未上传的分片
      const chunksToUpload = chunks.filter((chunk) => !uploadedChunks.includes(chunk.index));

      if (chunksToUpload.length === 0) {
        setStatusMessage('所有分片已上传，正在合并...');
        setUploadProgress(99);
      } else {
        // 5. 上传未完成的分片
        // 初始化进度追踪
        const totalSize = file.size;
        let uploadedBytes = 0;

        // 计算已上传的字节数
        uploadedBytes = uploadedChunks.reduce((acc, index) => {
          const chunk = chunks.find((c) => c.index === index);
          return acc + (chunk ? chunk.blob.size : 0);
        }, 0);

        // 初始化分片加载进度
        const chunkLoaded: number[] = [];
        chunks.forEach((chunk) => {
          // 对已上传的分片，设置为完整大小
          chunkLoaded[chunk.index] = uploadedChunks.includes(chunk.index) ? chunk.blob.size : 0;
        });

        // 更新进度的函数
        const updateProgress = (diffBytes: number) => {
          uploadedBytes += diffBytes;
          const percent = (uploadedBytes / totalSize) * 100;
          setUploadProgress(Math.min(99, percent)); // 留1%给合并操作
        };

        // 初始显示已上传的进度
        updateProgress(0);

        // 显示已经上传的分片信息
        if (uploadedChunks.length > 0) {
          setStatusMessage(`检测到${uploadedChunks.length}个分片已上传，继续上传剩余${chunksToUpload.length}个分片...`);
        }

        // 6. 并发上传所有分片
        await uploadChunksWithConcurrency(chunksToUpload, fileHash, file.name, chunkLoaded, updateProgress);
      }

      // 7. 所有分片上传完成，请求服务器合并文件
      setStatusMessage('分片上传完成，通知服务器合并...');
      await request<API.IRestInfo>('/api/file/merge', {
        method: 'POST',
        data: {
          fileName: file.name,
          fileHash,
          totalChunks,
        },
      });

      setStatusMessage('上传完成，文件合并成功！');
      setUploadProgress(100);
      alert('文件上传成功！');
    } catch (err: unknown) {
      console.error('上传失败:', err);
      setStatusMessage(`❌ 上传失败: ${(err as Error).message}`);
      setIsProcessing(false);
    } finally {
      uploadingRef.current = false;
    }
  }, [file, uploadChunksWithConcurrency]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>大文件上传（主线程版本 - 无Web Worker）</h2>

      <div className={styles['info-message']}>ℹ️ 此版本在主线程处理文件，大文件可能导致页面暂时无响应</div>

      <div className={styles['file-input-container']}>
        <input type="file" onChange={handleFileChange} className={styles['file-input']} />
        <button
          onClick={() => {
            handleUpload();
          }}
          disabled={!file || uploadingRef.current}
          className={`${styles['upload-button']} ${!file || uploadingRef.current ? styles.disabled : styles.enabled}`}
        >
          {uploadingRef.current ? '上传中...' : '开始上传'}
        </button>
      </div>

      {/* 文件信息展示 */}
      <FileInfo file={fileInfo} />

      {/* 进度条和状态显示 */}
      {(uploadProgress > 0 || isProcessing || statusMessage) && (
        <div className={styles['progress-container']}>
          <ProgressBar progress={uploadProgress} />

          {/* 状态消息 */}
          <div className={styles['status-message']}>
            <div>{statusMessage}</div>
          </div>

          {/* 处理进度（哈希计算和分片创建） */}
          {isProcessing && (
            <div className={styles['processing-progress']}>
              <div className={styles['processing-title']}>文件处理进度</div>

              {/* 哈希计算进度 */}
              {hashProgress > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div className={styles['small-progress-bar']}>
                    <div className={styles['hash-progress-bar']} style={{ width: `${hashProgress}%` }} />
                  </div>
                  <div className={styles['progress-labels']}>
                    <span className={styles['progress-label']}>哈希计算</span>
                    <span className={styles['progress-label']}>{hashProgress.toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* 分片创建进度 */}
              {chunksProgress > 0 && (
                <div>
                  <div className={styles['small-progress-bar']}>
                    <div className={styles['chunks-progress-bar']} style={{ width: `${chunksProgress}%` }} />
                  </div>
                  <div className={styles['progress-labels']}>
                    <span className={styles['progress-label']}>分片创建</span>
                    <span className={styles['progress-label']}>{chunksProgress.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewPage;
