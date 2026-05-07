import styles from '../index.module.css';

export const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <div className={styles.eyebrow}>React 19 Concurrent UI Lab</div>
        <h1 className={styles.heroTitle}>useDeferredValue + useTransition 可视化实验室</h1>
        <p className={styles.heroText}>
          同一份重列表，同样的筛选和模拟计算，分别走“直接更新”“延后派生值”“低优先级状态更新”和“两者组合”四条路径。
          观察输入回显、结果查询值、提交耗时和列表刷新，就能直观看到 React
          如何把紧急交互和昂贵渲染拆开处理。
        </p>
        <div className={styles.heroTags}>
          <span className={styles.heroTag}>紧急：输入框字符</span>
          <span className={styles.heroTag}>可延后：结果列表</span>
          <span className={styles.heroTag}>组合：transition → deferred</span>
          <span className={styles.heroTag}>对比：同数据同负载</span>
        </div>
      </div>

      <aside className={styles.diagram} aria-label="React concurrent rendering diagram">
        <div className={styles.diagramTitle}>
          <strong>调度优先级像三条车道</strong>
          <span>输入、派生值和列表渲染不必挤在同一次高优先级更新里。</span>
        </div>
        <div className={styles.laneStack}>
          <div className={styles.lane}>
            <div className={styles.laneName}>
              紧急车道
              <span>onChange / cursor</span>
            </div>
            <div className={styles.laneTrack}>
              <div className={`${styles.laneFill} ${styles.laneUrgent}`} />
              <div className={styles.lanePointer} />
            </div>
          </div>
          <div className={styles.lane}>
            <div className={styles.laneName}>
              deferred 车道
              <span>useDeferredValue(value)</span>
            </div>
            <div className={styles.laneTrack}>
              <div className={`${styles.laneFill} ${styles.laneDeferred}`} />
            </div>
          </div>
          <div className={styles.lane}>
            <div className={styles.laneName}>
              transition 车道
              <span>startTransition(update)</span>
            </div>
            <div className={styles.laneTrack}>
              <div className={`${styles.laneFill} ${styles.laneTransition}`} />
            </div>
          </div>
          <div className={styles.lane}>
            <div className={styles.laneName}>
              组合车道
              <span>transition → deferred</span>
            </div>
            <div className={styles.laneTrack}>
              <div className={`${styles.laneFill} ${styles.laneCombined}`} />
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
};
