import { useMemo, useState } from 'react';

import { CodeShowcase } from './components/CodeShowcase';
import { ControlPanel } from './components/ControlPanel';
import { ExperimentSection } from './components/ExperimentSection';
import { HeroSection } from './components/HeroSection';
import { LessonSection } from './components/LessonSection';
import { PRESET_QUERIES } from './constants';
import { useMediaQuery } from './hooks/useMediaQuery';
import styles from './index.module.css';
import type { ExperimentConfig, Mode } from './types';

const React19ConcurrentDemo = () => {
  const [workFactor, setWorkFactor] = useState(1_800);
  const [visibleCount, setVisibleCount] = useState(70);
  const [presetKey, setPresetKey] = useState(0);
  const [activeMode, setActiveMode] = useState<Mode>('direct');
  const useTabbedLayout = useMediaQuery('(max-width: 1440px)');

  const presetQuery = PRESET_QUERIES[presetKey % PRESET_QUERIES.length];
  const experiments: ExperimentConfig[] = useMemo(
    () => [
      {
        mode: 'direct',
        title: '1. 直接更新',
        shortTitle: '直接更新',
        lead: '输入值同时驱动重列表；列表越重，字符提交越容易被拖慢。',
        iconClassName: styles.directIcon,
      },
      {
        mode: 'deferred',
        title: '2. useDeferredValue',
        shortTitle: 'Deferred',
        lead: '输入值立即提交，列表读取 deferredValue；旧结果会短暂停留。',
        iconClassName: styles.deferredIcon,
      },
      {
        mode: 'transition',
        title: '3. useTransition',
        shortTitle: 'Transition',
        lead: '输入值立即提交，列表查询状态放进 startTransition 低优先级更新。',
        iconClassName: styles.transitionIcon,
      },
      {
        mode: 'combined',
        title: '4. useTransition + useDeferredValue',
        shortTitle: '组合',
        lead: '先用 transition 降低查询状态优先级，再用 deferredValue 让结果消费继续慢半拍。',
        iconClassName: styles.combinedIcon,
      },
    ],
    [],
  );

  const rotatePreset = () => {
    setPresetKey((current) => current + 1);
  };

  return (
    <main className={styles.page}>
      <HeroSection />
      <CodeShowcase />
      <ControlPanel
        presetQuery={presetQuery}
        workFactor={workFactor}
        visibleCount={visibleCount}
        onWorkFactorChange={setWorkFactor}
        onVisibleCountChange={setVisibleCount}
        onRotatePreset={rotatePreset}
      />
      <ExperimentSection
        activeMode={activeMode}
        experiments={experiments}
        useTabbedLayout={useTabbedLayout}
        workFactor={workFactor}
        visibleCount={visibleCount}
        onActiveModeChange={setActiveMode}
      />
      <LessonSection />
    </main>
  );
};

export default React19ConcurrentDemo;
