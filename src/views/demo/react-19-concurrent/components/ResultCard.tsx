import { memo } from 'react';

import styles from '../index.module.css';
import type { DemoItem } from '../types';
import { burnCpu } from '../utils';

interface ResultCardProps {
  item: DemoItem;
  queryLength: number;
  workFactor: number;
}

export const ResultCard = memo(({ item, queryLength, workFactor }: ResultCardProps) => {
  const heat = burnCpu(item.id + queryLength * 19, workFactor);

  return (
    <div className={styles.resultCard}>
      <div className={styles.resultStripe} style={{ background: item.accent }} />
      <div className={styles.resultMain}>
        <div className={styles.resultTitle}>
          <strong>{item.name}</strong>
          <span className={styles.statusPill}>{item.tag}</span>
        </div>
        <div className={styles.resultMeta}>
          {item.city} · {item.detail}
        </div>
      </div>
      <div className={styles.resultScore}>
        <strong>{Math.min(99, item.score + (heat % 8))}</strong>
        <span>score</span>
      </div>
    </div>
  );
});

ResultCard.displayName = 'ResultCard';
