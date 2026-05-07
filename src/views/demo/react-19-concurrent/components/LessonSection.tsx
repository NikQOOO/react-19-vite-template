import {
  ClockCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

import styles from '../index.module.css';

export const LessonSection = () => {
  return (
    <section className={styles.lessonBand}>
      <article className={styles.lesson}>
        <h3>
          <PauseCircleOutlined /> 直接更新的问题
        </h3>
        <p>
          受控输入和重列表共享同一个同步状态。React
          必须把字符、筛选、排序、列表提交放在同一次更新里， 所以昂贵渲染会直接影响输入体感。
        </p>
      </article>
      <article className={styles.lesson}>
        <h3>
          <ClockCircleOutlined /> useDeferredValue 的定位
        </h3>
        <p>
          <span className={styles.codeToken}>useDeferredValue</span>{' '}
          不改变源状态，只让派生消费者晚一点跟上。
          适合“输入框必须马上动，搜索结果可以慢半拍”的场景。
        </p>
      </article>
      <article className={styles.lesson}>
        <h3>
          <PlayCircleOutlined /> useTransition 的定位
        </h3>
        <p>
          <span className={styles.codeToken}>startTransition</span> 把某次状态更新标记为非紧急，并用
          <span className={styles.codeToken}>isPending</span>{' '}
          暴露过渡状态。适合主动把重视图切换、搜索结果更新、Tab 内容刷新降级。
        </p>
      </article>
      <article className={styles.lesson}>
        <h3>
          <ThunderboltOutlined /> 两者组合
        </h3>
        <p>
          组合不是必须的默认写法。它适合更重的视图：先用
          <span className={styles.codeToken}>startTransition</span>{' '}
          标记“查询状态更新不紧急”，再让列表读取
          <span className={styles.codeToken}>useDeferredValue(query)</span>
          ，把状态提交和重列表消费都从输入体验里拆出去。
        </p>
      </article>
    </section>
  );
};
