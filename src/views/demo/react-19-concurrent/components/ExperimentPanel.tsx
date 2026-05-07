import {
  FieldTimeOutlined,
  FireOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Input } from 'antd';
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import styles from '../index.module.css';
import type { Mode } from '../types';
import { formatMs, formatQuery } from '../utils';
import { HeavyResults } from './HeavyResults';

interface ExperimentPanelProps {
  mode: Mode;
  title: string;
  lead: string;
  iconClassName: string;
  workFactor: number;
  visibleCount: number;
}

const MODE_COPY: Record<
  Mode,
  {
    status: string;
    statusClassName: string;
    inputLabel: string;
    resultLabel: string;
  }
> = {
  direct: {
    status: '同优先级',
    statusClassName: styles.statusHot,
    inputLabel: '输入值',
    resultLabel: '列表查询值',
  },
  deferred: {
    status: '延后列表',
    statusClassName: styles.statusWarm,
    inputLabel: '即时输入',
    resultLabel: 'deferredValue',
  },
  transition: {
    status: '低优先级',
    statusClassName: styles.statusCool,
    inputLabel: '即时输入',
    resultLabel: 'transition state',
  },
  combined: {
    status: '双层缓冲',
    statusClassName: styles.statusCombo,
    inputLabel: '即时输入',
    resultLabel: 'deferred transition',
  },
};

export const ExperimentPanel = memo(
  ({ mode, title, lead, iconClassName, workFactor, visibleCount }: ExperimentPanelProps) => {
    const [text, setText] = useState('');
    const [transitionQuery, setTransitionQuery] = useState('');
    const [inputLag, setInputLag] = useState<number | null>(null);
    const [resultLag, setResultLag] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const inputStartedAtRef = useRef(0);
    const deferredText = useDeferredValue(text);
    const deferredTransitionQuery = useDeferredValue(transitionQuery);

    const resultQuery = useMemo(() => {
      if (mode === 'deferred') return deferredText;
      if (mode === 'transition') return transitionQuery;
      if (mode === 'combined') return deferredTransitionQuery;
      return text;
    }, [deferredText, deferredTransitionQuery, mode, text, transitionQuery]);

    const isStale =
      mode === 'deferred'
        ? text !== deferredText
        : (mode === 'transition' && text !== transitionQuery) ||
          (mode === 'combined' &&
            (text !== transitionQuery || transitionQuery !== deferredTransitionQuery));
    const copy = MODE_COPY[mode];

    useEffect(() => {
      if (inputStartedAtRef.current === 0) return;
      setInputLag(performance.now() - inputStartedAtRef.current);
    }, [text]);

    useEffect(() => {
      if (inputStartedAtRef.current === 0) return;
      setResultLag(performance.now() - inputStartedAtRef.current);
    }, [resultQuery]);

    const updateText = (nextValue: string) => {
      inputStartedAtRef.current = performance.now();
      setText(nextValue);

      if (mode === 'transition' || mode === 'combined') {
        startTransition(() => {
          setTransitionQuery(nextValue);
        });
      }
    };

    return (
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div className={`${styles.panelIcon} ${iconClassName}`}>
            {mode === 'direct' && <FireOutlined />}
            {mode === 'deferred' && <FieldTimeOutlined />}
            {mode === 'transition' && <ThunderboltOutlined />}
            {mode === 'combined' && (
              <span className={styles.comboGlyph}>
                <ThunderboltOutlined />
                <FieldTimeOutlined />
              </span>
            )}
          </div>
          <div>
            <h2 className={styles.panelTitle}>{title}</h2>
            <p className={styles.panelLead}>{lead}</p>
          </div>
        </header>

        <div className={styles.panelBody}>
          <div className={styles.inputWrap}>
            <label className={styles.inputLabel}>
              <span>关键词</span>
              <span className={`${styles.statusPill} ${copy.statusClassName}`}>
                {isPending ? 'pending' : isStale ? 'stale' : copy.status}
              </span>
            </label>
            <Input
              value={text}
              size="large"
              allowClear
              prefix={<SearchOutlined />}
              placeholder="输入 React、render、上海、chart..."
              onChange={(event) => updateText(event.target.value)}
            />
          </div>

          <div className={styles.queryCompare}>
            <div className={styles.queryBox}>
              <span>{copy.inputLabel}</span>
              <strong>{formatQuery(text)}</strong>
            </div>
            <div className={styles.queryBox}>
              <span>{copy.resultLabel}</span>
              <strong>{formatQuery(resultQuery)}</strong>
            </div>
          </div>

          <div className={styles.metricGrid}>
            <div className={styles.metric}>
              <span>输入提交</span>
              <strong>{formatMs(inputLag)}</strong>
            </div>
            <div className={styles.metric}>
              <span>结果提交</span>
              <strong>{formatMs(resultLag)}</strong>
            </div>
            <div className={styles.metric}>
              <span>渲染项数</span>
              <strong>{visibleCount}</strong>
            </div>
          </div>

          <HeavyResults query={resultQuery} visibleCount={visibleCount} workFactor={workFactor} />
        </div>
      </section>
    );
  },
);

ExperimentPanel.displayName = 'ExperimentPanel';
