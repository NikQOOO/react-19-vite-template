import { Button, Card, Col, Divider, Input, Progress, Row, Space, Tag, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';

import type { MainToWorkerMsg, WorkerToMainMsg } from './types';

/** 对比演示用的任务时长 5 秒 */
const TASK_MS = 5_000;
/** 每个 Time Slice 分片占用主线程的预算 */
const SLICE_BUDGET_MS = 20;

/** 持续占用 CPU 直到耗尽目标时长 */
const burnCpu = (ms: number) => {
  const start = performance.now();
  let seed = 0;
  // Math.sqrt 是个相对耗时的操作，可以更明显地模拟 CPU 密集型任务
  while (performance.now() - start < ms) seed += Math.sqrt((seed + 1) % 10_000);
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const fmt = (ms: number | null) => (ms !== null ? `${ms.toFixed(0)} ms` : '—');

const Demo1 = () => {
  // --- ① 阻塞 ---
  const [blockDuration, setBlockDuration] = useState<number | null>(null);
  const [blockRunning, setBlockRunning] = useState(false);

  // --- ② Time Slice ---
  const [sliceDuration, setSliceDuration] = useState<number | null>(null);
  const [sliceProgress, setSliceProgress] = useState(0);
  const [sliceRunning, setSliceRunning] = useState(false);
  const cancelSliceRef = useRef(false);

  // --- ③ Worker ---
  const [workerDuration, setWorkerDuration] = useState<number | null>(null);
  const [workerRunning, setWorkerRunning] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  /** ① 同步阻塞主线程执行任务 */
  const runBlocking = () => {
    setBlockRunning(true);
    setBlockDuration(null);
    // 用 setTimeout(0) 让 loading 状态先渲染，再进入阻塞
    setTimeout(() => {
      const start = performance.now();
      burnCpu(TASK_MS);
      setBlockDuration(performance.now() - start);
      setBlockRunning(false);
    }, 0);
  };

  /** ② 每隔 SLICE_BUDGET_MS 通过 setTimeout(0) 让出主线程 */
  const runTimeSlice = async () => {
    if (sliceRunning) return;
    cancelSliceRef.current = false;
    setSliceProgress(0);
    setSliceDuration(null);
    setSliceRunning(true);
    const start = performance.now();
    while (!cancelSliceRef.current) {
      burnCpu(SLICE_BUDGET_MS);
      const elapsed = performance.now() - start;
      setSliceProgress(Math.min(100, Math.round((elapsed / TASK_MS) * 100)));
      if (elapsed >= TASK_MS) {
        setSliceDuration(elapsed);
        break;
      }
      await sleep(0);
    }
    setSliceRunning(false);
  };

  /** ③ 将任务派发到 Worker 独立线程 */
  const runWorkerTask = () => {
    if (!workerRef.current || workerRunning) return;
    setWorkerRunning(true);
    setWorkerDuration(null);
    workerRef.current.postMessage({ durationMs: TASK_MS } satisfies MainToWorkerMsg);
  };

  useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
      name: 'demo1-worker',
    });
    worker.onmessage = (e: MessageEvent<WorkerToMainMsg>) => {
      if (e.data.type === 'ready') {
        setIsWorkerReady(true);
        console.log('[Main Thread] Worker 已就绪');
        return;
      }
      setWorkerDuration(e.data.duration);
      setWorkerRunning(false);
    };
    worker.onerror = () => setIsWorkerReady(false);
    workerRef.current = worker;

    return () => {
      worker.terminate();
      cancelSliceRef.current = true;
      console.log('[Main Thread] Worker 已斷開');
    };
  }, []);

  return (
    <div>
      <Typography.Title level={2}>Demo 1 — 主线程阻塞 vs Time Slice vs Web Worker</Typography.Title>
      <Typography.Paragraph type="secondary">
        三种方式各执行约 {TASK_MS / 1_000}s 的 CPU 密集任务，对比对 UI 响应的影响。
        点击按钮后在下方输入框中尝试输入，感受主线程是否被阻塞。
      </Typography.Paragraph>

      <Divider />

      <Row gutter={[16, 16]}>
        {/* ① 阻塞 */}
        <Col span={8}>
          <Card title="① 阻塞主线程">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                任务在主线程同步执行，期间 UI 完全冻结，输入框无法响应。
              </Typography.Text>
              <Input placeholder="运行时尝试在这里输入..." />
              <Button type="primary" danger loading={blockRunning} onClick={runBlocking}>
                运行 {TASK_MS / 1_000}s 阻塞任务
              </Button>
              <Typography.Text>耗时：{fmt(blockDuration)}</Typography.Text>
            </Space>
          </Card>
        </Col>

        {/* ② Time Slice */}
        <Col span={8}>
          <Card title="② Time Slice">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                每隔 {SLICE_BUDGET_MS}ms 通过 <Typography.Text code>setTimeout(0)</Typography.Text>{' '}
                让出主线程，输入框保持可用。
              </Typography.Text>
              <Input placeholder="运行时可以在这里正常输入..." />
              <Button type="primary" loading={sliceRunning} onClick={() => void runTimeSlice()}>
                运行 {TASK_MS / 1_000}s 分片任务
              </Button>
              <Progress percent={sliceProgress} status={sliceRunning ? 'active' : 'normal'} />
              <Typography.Text>耗时：{fmt(sliceDuration)}</Typography.Text>
            </Space>
          </Card>
        </Col>

        {/* ③ Worker */}
        <Col span={8}>
          <Card
            title="③ Web Worker"
            extra={
              <Tag color={isWorkerReady ? 'green' : 'default'}>
                {isWorkerReady ? 'Ready' : 'Loading'}
              </Tag>
            }
          >
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                任务在独立 Worker 线程执行，主线程完全不受影响，输入流畅。
              </Typography.Text>
              <Input placeholder="运行时可以在这里正常输入..." />
              <Button
                type="primary"
                loading={workerRunning}
                disabled={!isWorkerReady}
                onClick={runWorkerTask}
              >
                运行 {TASK_MS / 1_000}s Worker 任务
              </Button>
              <Typography.Text>耗时：{fmt(workerDuration)}</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Demo1;
