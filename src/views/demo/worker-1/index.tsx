import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  message,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';

import { burnCPU, fmt, yieldToMain } from './utils';
import type { WorkerToMainMsg } from './worker';

/** 对比演示用的任务时长 5 秒 */
const TASK_MS = 5_000;

/** 每个 Time Slice 分片占用主线程的预算 */
const FRAGMENT_BUDGET_MS = 20;

const DemoWorker1 = () => {
  // --- 1️⃣ 主线程中直接执行(同步)耗时任务 -----------------------
  const [blockDuration, setBlockDuration] = useState<number | null>(null);
  const [blockRunning, setBlockRunning] = useState(false);

  const handleBlock = () => {
    setBlockRunning(true);
    setBlockDuration(null);

    // 用 setTimeout(0) 让 loading 状态先渲染，再进入阻塞
    setTimeout(() => {
      const start = performance.now();
      burnCPU(TASK_MS);
      setBlockDuration(performance.now() - start);
      setBlockRunning(false);
    }, 0);
  };

  // --- 2️⃣ 主线程中直接执行(同步)耗时任务，加上Time Slice -----------------------
  const [sliceDuration, setSliceDuration] = useState<number | null>(null);
  const [sliceProgress, setSliceProgress] = useState(0);
  const [sliceRunning, setSliceRunning] = useState(false);
  const cancelSliceRef = useRef(false);

  const handleTimeSlice = async () => {
    setSliceProgress(0);
    setSliceDuration(null);
    setSliceRunning(true);
    cancelSliceRef.current = false;

    const start = performance.now();

    while (!cancelSliceRef.current) {
      // 模拟分片执行，每片占用主线程的时间不超过 FRAGMENT_BUDGET_MS
      burnCPU(FRAGMENT_BUDGET_MS);
      // 计算已完成的进度
      const elapsed = performance.now() - start;
      setSliceProgress(Math.min(100, Math.round((elapsed / TASK_MS) * 100)));
      // 如果已完成目标时长，结束循环
      if (elapsed >= TASK_MS) {
        setSliceDuration(elapsed);
        break;
      }
      // 通过 setTimeout(0) 让出主线程，允许 UI 更新和响应用户输入
      await yieldToMain();
    }
    setSliceRunning(false);
  };

  // --- 3️⃣ Worker 中执行耗时任务，主线程负责 UI 交互 -----------------------
  const [workerDuration, setWorkerDuration] = useState<number | null>(null);
  const [workerRunning, setWorkerRunning] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const handleWorker = () => {
    if (!workerRef.current || workerRunning) return;

    setWorkerRunning(true);
    setWorkerDuration(null);

    // 向 Worker 线程发送任务消息
    workerRef.current.postMessage({ durationMs: TASK_MS });
  };

  // 初始化 Worker 实例
  useEffect(() => {
    const _worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
      name: 'DemoWorker1',
    });
    workerRef.current = _worker;

    // 监听 Worker 消息
    _worker.onmessage = (event: MessageEvent<WorkerToMainMsg>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'ready':
          setIsWorkerReady(true);
          message.success('[Main Thread] Worker 已就绪');
          break;
        case 'done':
          setWorkerDuration(msg.duration);
          setWorkerRunning(false);
          break;
      }
    };

    _worker.onerror = (error) => {
      message.error(`[Main Thread] Worker 错误: ${error.message}`);
      setWorkerRunning(false);
    };

    return () => {
      _worker.terminate();
      workerRef.current = null;
      message.warning('[Main Thread] Worker 已斷開');
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={1}>WEB WORKER(1) 简单示例</Typography.Title>
      <Typography.Paragraph type="secondary">
        三种方式各执行约 {TASK_MS / 1_000}s 的 CPU 密集任务，对比对 UI 响应的影响。
        点击按钮后在下方输入框中尝试输入，感受主线程是否被阻塞。
      </Typography.Paragraph>
      <Divider />
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="1️⃣ 主线程中直接执行(同步)耗时任务" extra={<Tag color="red">阻塞主线程</Tag>}>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                任务在主线程同步执行，期间 UI 完全冻结，输入框无法响应。
              </Typography.Text>
              <Input placeholder="运行时尝试在这里输入..." />
              <Button type="primary" danger loading={blockRunning} onClick={handleBlock}>
                运行 {TASK_MS / 1_000}s 阻塞任务
              </Button>
              <Divider />
              <Typography.Text strong>耗时：{fmt(blockDuration)}</Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="2️⃣ 主线程中直接执行(同步)耗时任务，加上Time Slice"
            extra={<Tag color="orange-inverse">可以接受</Tag>}
          >
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                每隔 {FRAGMENT_BUDGET_MS}ms 通过{' '}
                <Typography.Text code>setTimeout(0)</Typography.Text> 让出主线程，输入框保持可用。
              </Typography.Text>
              <Input placeholder="运行时尝试在这里输入..." />
              <Button type="primary" ghost loading={sliceRunning} onClick={handleTimeSlice}>
                运行 {TASK_MS / 1_000}s 分片任务
              </Button>
              <Divider />
              <Progress percent={sliceProgress} status={sliceRunning ? 'active' : 'normal'} />
              <Typography.Text strong>耗时：{fmt(sliceDuration)}</Typography.Text>
            </Space>
          </Card>
        </Col>
        <Divider />
        <Col span={12}>
          <Card
            title="3️⃣ Worker 中执行耗时任务，主线程负责 UI 交互"
            extra={<Tag color="green">流畅</Tag>}
          >
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                任务在 Worker 线程执行，主线程保持流畅，输入框完全可用。{' '}
                {isWorkerReady && <Tag color="lime">Worker 已就绪</Tag>}
              </Typography.Text>
              <Input placeholder="运行时尝试在这里输入..." />
              <Button
                type="primary"
                ghost
                loading={workerRunning || !isWorkerReady}
                onClick={handleWorker}
                disabled={!isWorkerReady || workerRunning}
              >
                运行 {TASK_MS / 1_000}s Worker 任务
              </Button>
              <Divider />
              <Typography.Text strong>耗时：{fmt(workerDuration)}</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DemoWorker1;
