import { Tabs } from 'antd';

import styles from '../index.module.css';
import type { ExperimentConfig, Mode } from '../types';
import { ExperimentPanel } from './ExperimentPanel';

interface ExperimentSectionProps {
  activeMode: Mode;
  experiments: ExperimentConfig[];
  useTabbedLayout: boolean;
  visibleCount: number;
  workFactor: number;
  onActiveModeChange: (mode: Mode) => void;
}

export const ExperimentSection = ({
  activeMode,
  experiments,
  useTabbedLayout,
  visibleCount,
  workFactor,
  onActiveModeChange,
}: ExperimentSectionProps) => {
  const activeExperiment =
    experiments.find((experiment) => experiment.mode === activeMode) ?? experiments[0]!;

  if (useTabbedLayout) {
    return (
      <section className={styles.tabbedExperiments}>
        <Tabs
          activeKey={activeMode}
          items={experiments.map((experiment) => ({
            key: experiment.mode,
            label: experiment.shortTitle,
          }))}
          onChange={(nextMode) => onActiveModeChange(nextMode as Mode)}
        />
        <ExperimentPanel
          key={activeExperiment.mode}
          mode={activeExperiment.mode}
          title={activeExperiment.title}
          lead={activeExperiment.lead}
          iconClassName={activeExperiment.iconClassName}
          workFactor={workFactor}
          visibleCount={visibleCount}
        />
      </section>
    );
  }

  return (
    <section className={styles.experimentGrid}>
      {experiments.map((experiment) => (
        <ExperimentPanel
          key={experiment.mode}
          mode={experiment.mode}
          title={experiment.title}
          lead={experiment.lead}
          iconClassName={experiment.iconClassName}
          workFactor={workFactor}
          visibleCount={visibleCount}
        />
      ))}
    </section>
  );
};
