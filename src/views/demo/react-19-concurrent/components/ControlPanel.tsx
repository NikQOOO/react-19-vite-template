import { DashboardOutlined } from '@ant-design/icons';
import { Slider, Tooltip } from 'antd';

import styles from '../index.module.css';

interface ControlPanelProps {
  presetQuery: string;
  workFactor: number;
  visibleCount: number;
  onWorkFactorChange: (value: number) => void;
  onVisibleCountChange: (value: number) => void;
  onRotatePreset: () => void;
}

export const ControlPanel = ({
  presetQuery,
  workFactor,
  visibleCount,
  onWorkFactorChange,
  onVisibleCountChange,
  onRotatePreset,
}: ControlPanelProps) => {
  return (
    <section className={styles.controlBand}>
      <div>
        <h2 className={styles.controlTitle}>实验控制台</h2>
        <p className={styles.controlText}>
          当前预设关键词是 <span className={styles.codeToken}>{presetQuery}</span>
          。可提高计算负载或渲染项数，卡顿差异会更明显；机器较慢时把滑块调低即可。
        </p>
      </div>
      <div className={styles.sliderBlock}>
        <div className={styles.sliderLabel}>
          <span>单项计算负载</span>
          <strong>{workFactor}</strong>
        </div>
        <Slider
          min={400}
          max={5_000}
          step={200}
          value={workFactor}
          tooltip={{ formatter: (value) => `${value} loops` }}
          onChange={onWorkFactorChange}
        />
      </div>
      <div className={styles.sliderBlock}>
        <div className={styles.sliderLabel}>
          <span>列表渲染项数</span>
          <strong>{visibleCount}</strong>
        </div>
        <Slider
          min={20}
          max={160}
          step={10}
          value={visibleCount}
          tooltip={{ formatter: (value) => `${value} items` }}
          onChange={onVisibleCountChange}
        />
      </div>
      <Tooltip title="切换一个推荐搜索词，再手动输入到四个实验框中对比。">
        <button className={styles.heroTag} type="button" onClick={onRotatePreset}>
          <DashboardOutlined /> 换预设词
        </button>
      </Tooltip>
    </section>
  );
};
