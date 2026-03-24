import { memo } from 'react';

import styles from './index.module.css';

const SkeletonList = () => (
  <div className={styles.skeleton}>
    {[0, 1, 2].map((i) => (
      <div key={i} className={styles.skeletonItem} />
    ))}
  </div>
);

export default memo(SkeletonList);
