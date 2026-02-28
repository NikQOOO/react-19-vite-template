import { Card, Divider, Space, Typography } from 'antd';

import { BenchmarkControl } from './components/BenchmarkControl';
import { BenchmarkTable } from './components/BenchmarkTable';
import { ConceptDiagram } from './components/ConceptDiagram';
import { TransferLogList } from './components/TransferLogList';
import { useDemo3Worker } from './hooks/useDemo3Worker';

const Demo3 = () => {
  const { isWorkerReady, isRunning, benchmarks, logs, runBenchmark, clearAll } = useDemo3Worker();

  return (
    <div>
      <Typography.Title level={2}>Demo 3 - Transferable Objects</Typography.Title>

      <Typography.Paragraph type="secondary">
        对比 <Typography.Text code>postMessage(msg)</Typography.Text>（Structured Clone）与{' '}
        <Typography.Text code>postMessage(msg, [buffer])</Typography.Text>（Transferable）
        两种传输方式的性能差异。选择不同的数据大小运行测试，观察传输开销从量变到质变的过程。
      </Typography.Paragraph>

      {/* 原理示意图 */}
      <ConceptDiagram />

      <Divider />

      {/* 操作区 */}
      <BenchmarkControl
        isWorkerReady={isWorkerReady}
        isRunning={isRunning}
        onRun={runBenchmark}
        onClear={clearAll}
      />

      <Divider />

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 对比结果表 */}
        <Card size="small" title="对比结果">
          <BenchmarkTable benchmarks={benchmarks} />
        </Card>

        {/* 传输日志 */}
        <Card size="small" title="传输日志（时间线）">
          <TransferLogList logs={logs} />
        </Card>
      </Space>
    </div>
  );
};

export default Demo3;
