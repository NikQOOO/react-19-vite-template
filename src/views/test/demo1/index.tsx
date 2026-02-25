import { Button, Card, Col, Divider, Input, Progress, Row, Space, Tag, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

type MainToWorkerMessage = {
  id: number;
  type: 'echo' | 'ping';
  payload: string;
  sentAt: number;
};

type WorkerToMainMessage = {
  id?: number;
  type: 'ready' | 'echo-result' | 'error';
  payload: string;
  duration?: number;
};

type LogItem = {
  id: number;
  from: 'main' | 'worker';
  text: string;
};

const DEMO_TASK_TOTAL_MS = 5_000;
const TIMESLICE_BUDGET_MS = 20;

const Demo1 = () => {
  // ===================== State =====================
  // 主线程输入框内容
  const [payload, setPayload] = useState('');
  // 展示在页面上的通信日志
  const [logs, setLogs] = useState<LogItem[]>([]);
  // 通过 worker 的 ready 消息驱动 UI 状态
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  // 阻塞示例输入框
  const [blockingInput, setBlockingInput] = useState('');
  // 分片示例输入框
  const [timesliceInput, setTimesliceInput] = useState('');
  // 同步阻塞方案耗时
  const [blockingDuration, setBlockingDuration] = useState<number | null>(null);
  // 时间分片方案耗时
  const [timesliceDuration, setTimesliceDuration] = useState<number | null>(null);
  // 时间分片进度（0-100）
  const [timesliceProgress, setTimesliceProgress] = useState(0);
  // 时间分片是否运行中
  const [isTimesliceRunning, setIsTimesliceRunning] = useState(false);

  // 持有 worker 实例，避免重复创建
  const workerRef = useRef<Worker | null>(null);
  // 生成递增消息 id，便于在日志中定位请求/响应
  const messageIdRef = useRef(1);
  // 时间分片取消标记（组件卸载时停止后续切片）
  const cancelTimesliceRef = useRef(false);

  // ===================== Events =====================
  // 统一追加日志入口，后续若要做格式化可集中处理
  const appendLog = useCallback((nextLog: LogItem) => {
    setLogs((prev) => [...prev, nextLog]);
  }, []);

  // 绑定 worker 事件，处理来自 worker 的消息和错误
  const bindWorkerEvents = useCallback(
    (worker: Worker) => {
      // 监听 worker 返回消息（ready / echo-result / error）
      worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
        const data = event.data;

        // ready 是初始化握手完成信号
        if (data.type === 'ready') {
          setIsWorkerReady(true);
          appendLog({
            id: Date.now(),
            from: 'worker',
            text: data.payload,
          });
          return;
        }

        appendLog({
          id: data.id ?? Date.now(),
          from: 'worker',
          text: `${data.payload}${typeof data.duration === 'number' ? ` (${data.duration.toFixed(2)}ms)` : ''}`,
        });
      };

      // worker 运行时错误（比如语法错误、未捕获异常）
      worker.onerror = () => {
        appendLog({
          id: Date.now(),
          from: 'worker',
          text: 'worker runtime error, please refresh page.',
        });
        setIsWorkerReady(false);
      };

      // postMessage 的数据结构无法被正确序列化/反序列化时触发
      worker.onmessageerror = () => {
        appendLog({
          id: Date.now(),
          from: 'worker',
          text: 'worker message parsing failed.',
        });
      };

      // 主线程启动后主动发 ping，与 worker 做一次握手
      const pingMessage: MainToWorkerMessage = {
        id: 0,
        type: 'ping',
        payload: 'init',
        sentAt: Date.now(),
      };
      worker.postMessage(pingMessage);
    },
    [appendLog],
  );

  // ===================== Handlers =====================
  // 发送消息到 worker，触发 echo 场景
  const handleSendMessage = useCallback(() => {
    const normalized = payload.trim();

    // 输入为空、worker 未初始化或还没 ready 时不发送
    if (!normalized || !workerRef.current || !isWorkerReady) {
      return;
    }

    const id = messageIdRef.current++;
    const data: MainToWorkerMessage = {
      id,
      type: 'echo',
      payload: normalized,
      sentAt: Date.now(),
    };

    appendLog({
      id,
      from: 'main',
      text: `sent -> ${normalized}`,
    });

    workerRef.current.postMessage(data);
    setPayload('');
  }, [appendLog, isWorkerReady, payload]);

  // 清空页面日志，便于重新观察本轮交互
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 持续占用 CPU 一段时间，用于演示主线程阻塞
  const burnCpu = useCallback((budgetMs: number) => {
    const started = performance.now();
    let seed = 0;

    while (performance.now() - started < budgetMs) {
      seed += Math.sqrt((seed + 1) % 10_000);
    }

    return seed;
  }, []);

  // 同步方案：一次性运行约 5 秒，期间输入框会明显卡住
  const runBlockingCase = useCallback(() => {
    setBlockingDuration(null);
    const startedAt = performance.now();
    burnCpu(DEMO_TASK_TOTAL_MS);
    setBlockingDuration(performance.now() - startedAt);
  }, [burnCpu]);

  // 时间分片方案：同样跑约 5 秒，但按 20ms 一片执行，片间让出主线程
  const runTimesliceCase = useCallback(() => {
    if (isTimesliceRunning) {
      return;
    }

    cancelTimesliceRef.current = false;
    setTimesliceProgress(0);
    setTimesliceDuration(null);
    setIsTimesliceRunning(true);

    const startedAt = performance.now();

    const runChunk = () => {
      if (cancelTimesliceRef.current) {
        setIsTimesliceRunning(false);
        return;
      }

      burnCpu(TIMESLICE_BUDGET_MS);

      const elapsed = performance.now() - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / DEMO_TASK_TOTAL_MS) * 100));
      setTimesliceProgress(nextProgress);

      if (elapsed < DEMO_TASK_TOTAL_MS) {
        setTimeout(runChunk, 0);
        return;
      }

      setTimesliceDuration(elapsed);
      setIsTimesliceRunning(false);
    };

    runChunk();
  }, [burnCpu, isTimesliceRunning]);

  // 组件挂载时创建 worker，并绑定事件；卸载时销毁 worker
  useEffect(() => {
    // 组件挂载时只创建一个 worker
    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
      name: 'demo1-worker',
    });
    workerRef.current = worker;
    bindWorkerEvents(worker);

    return () => {
      cancelTimesliceRef.current = true;

      // 组件卸载时销毁 worker，释放线程资源
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [bindWorkerEvents]);

  return (
    <div>
      <Space style={{ marginBottom: 8 }}>
        <Tag color={isWorkerReady ? 'green' : 'red'}>
          {isWorkerReady ? 'Worker Ready' : 'Worker Stopped'}
        </Tag>
        <Button onClick={clearLogs}>清空日志</Button>
      </Space>
      <Divider />

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title={<Typography.Title level={2}>创建一个 Web Worker </Typography.Title>}>
            <Space>
              <Input
                placeholder="Type a message to send to worker"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                onPressEnter={handleSendMessage}
              />
              <Button
                type="primary"
                onClick={handleSendMessage}
                disabled={!payload.trim() || !isWorkerReady}
              >
                Send Message to Worker
              </Button>
            </Space>
            <Divider>Message Log</Divider>
            <ol>
              {logs.map((log) => (
                <li key={`${log.id}-${log.from}`}>
                  <Typography.Text type={log.from === 'main' ? undefined : 'success'}>
                    [{log.from}] {log.text}
                  </Typography.Text>
                </li>
              ))}
            </ol>
          </Card>
        </Col>

        <Col span={12}>
          <Card title={<Typography.Title level={2}>经典 Time Slice 案例</Typography.Title>}>
            <Typography.Paragraph type="secondary">
              目标：都执行约 5
              秒的大任务。左边是同步阻塞（输入会卡住），右边是时间分片（输入可持续响应）。
            </Typography.Paragraph>

            <Divider />

            <Typography.Title level={5}>1) 无 Time Slice（会阻塞输入）</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="先点下面按钮，再尝试输入（会卡住）"
                value={blockingInput}
                onChange={(event) => setBlockingInput(event.target.value)}
              />
              <Button onClick={runBlockingCase}>开始 5s 阻塞任务</Button>
              <Typography.Text type="secondary">
                阻塞任务耗时：{blockingDuration ? `${blockingDuration.toFixed(2)}ms` : '未执行'}
              </Typography.Text>
            </Space>

            <Divider />

            <Typography.Title level={5}>2) 有 Time Slice（输入保持可响应）</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="运行分片任务时可继续输入"
                value={timesliceInput}
                onChange={(event) => setTimesliceInput(event.target.value)}
              />
              <Button type="primary" onClick={runTimesliceCase} loading={isTimesliceRunning}>
                开始 5s 分片任务
              </Button>
              <Typography.Text type="secondary">
                分片任务耗时：{timesliceDuration ? `${timesliceDuration.toFixed(2)}ms` : '未完成'}
              </Typography.Text>
            </Space>

            <Divider />
            <Progress
              percent={timesliceProgress}
              status={isTimesliceRunning ? 'active' : 'normal'}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Demo1;
