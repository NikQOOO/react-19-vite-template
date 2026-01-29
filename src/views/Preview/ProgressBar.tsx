import styles from './index.module.css';

interface ProgressBarProps {
  progress: number;
}

/**
 * 上传进度条组件
 */
const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
  <div style={{ marginBottom: '10px' }}>
    <div className={styles['progress-bar-container']}>
      <div className={styles['progress-bar']} style={{ width: `${progress}%` }} />
    </div>
    <div className={styles['progress-text']}>
      <span>上传进度</span>
      <span>{progress.toFixed(2)}%</span>
    </div>
  </div>
);

export default ProgressBar;
