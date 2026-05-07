import { CodeOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import { memo } from 'react';

import { CODE_EXAMPLES } from '../constants';
import styles from '../index.module.css';

export const CodeShowcase = memo(() => {
  return (
    <section className={styles.codeShowcase}>
      <div className={styles.codeIntro}>
        <div className={styles.codeTitleRow}>
          <span className={styles.codeIcon}>
            <CodeOutlined />
          </span>
          <div>
            <h2>代码速览</h2>
            <p>先看写法，再在下面输入同样关键词观察调度差异。</p>
          </div>
        </div>
        <div className={styles.codeFlow}>
          <span>输入 state</span>
          <span>transition 降级</span>
          <span>deferred 延后消费</span>
          <span>重列表渲染</span>
        </div>
      </div>

      <Tabs
        defaultActiveKey="combined"
        items={CODE_EXAMPLES.map((example) => ({
          key: example.key,
          label: example.label,
          children: (
            <div className={styles.codePanel}>
              <div className={styles.codePanelCopy}>
                <strong>{example.title}</strong>
                <span>{example.note}</span>
              </div>
              <pre className={styles.codeBlock}>
                <code>{example.code}</code>
              </pre>
            </div>
          ),
        }))}
      />
    </section>
  );
});

CodeShowcase.displayName = 'CodeShowcase';
