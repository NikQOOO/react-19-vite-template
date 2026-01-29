import styles from './index.module.css';

interface FileInfoProps {
  file: {
    name: string;
    size: number;
    type: string;
  } | null;
}

/**
 * 文件信息组件
 */
const FileInfo: React.FC<FileInfoProps> = ({ file }) => {
  if (!file) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={styles['file-info']}>
      <div>
        <strong>文件名:</strong> {file.name}
      </div>
      <div>
        <strong>文件大小:</strong> {formatFileSize(file.size)}
      </div>
      <div>
        <strong>文件类型:</strong> {file.type || '未知'}
      </div>
    </div>
  );
};

export default FileInfo;
