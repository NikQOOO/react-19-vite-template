import { memo, useMemo } from 'react';

import styles from '../index.module.css';
import { filterItems } from '../utils';
import { ResultCard } from './ResultCard';

interface HeavyResultsProps {
  query: string;
  visibleCount: number;
  workFactor: number;
}

export const HeavyResults = memo(({ query, visibleCount, workFactor }: HeavyResultsProps) => {
  const items = useMemo(() => {
    const filteredItems = filterItems(query);
    return filteredItems.slice(0, visibleCount);
  }, [query, visibleCount]);

  if (items.length === 0) {
    return <div className={styles.emptyState}>没有匹配结果，换一个关键词试试。</div>;
  }

  return (
    <div className={styles.resultList}>
      {items.map((item) => (
        <ResultCard key={item.id} item={item} queryLength={query.length} workFactor={workFactor} />
      ))}
    </div>
  );
});

HeavyResults.displayName = 'HeavyResults';
