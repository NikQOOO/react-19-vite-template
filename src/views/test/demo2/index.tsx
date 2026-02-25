import { Button, Card, Divider, Input, Select, Space, Tag, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { WorkerAction } from './types';
import { Demo2WorkerManager } from './workerManager';

type LogItem = {
  id: number;
  from: 'main' | 'worker';
  text: string;
};

// 页面提供的任务选项
const ACTION_OPTIONS: Array<{ label: string; value: WorkerAction }> = [
  { label: 'Echo (原样返回)', value: 'echo' },
  { label: 'Uppercase (转大写)', value: 'uppercase' },
];

// 不同任务的默认输入，便于快速体验
const DEFAULT_PAYLOAD_BY_ACTION: Record<WorkerAction, string> = {
  echo: 'hello worker',
  uppercase: 'hello manager',
};

const Demo2 = () => {
  // 当前任务类型
  const [action, setAction] = useState<WorkerAction>('echo');
  // 用户输入
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD_BY_ACTION.echo);
  // 消息日志
  const [logs, setLogs] = useState<LogItem[]>([]);
  // worker 初始化状态
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  // 当前是否在执行请求（用于按钮 loading）
  const [isRunning, setIsRunning] = useState(false);

  // manager 作为单例存在于组件生命周期内
  const managerRef = useRef<Demo2WorkerManager | null>(null);
  // 日志自增 id
  const logIdRef = useRef(1);

  // 统一日志追加入口
  const appendLog = useCallback((from: LogItem['from'], text: string) => {
    setLogs((prev) => [...prev, { id: logIdRef.current++, from, text }]);
  }, []);

  // 初始化 manager，并等待 worker ready
  const setupManager = useCallback(async () => {
    const manager = new Demo2WorkerManager();
    managerRef.current = manager;

    try {
      await manager.ready;
      setIsWorkerReady(true);
      appendLog('worker', 'worker manager ready.');
    } catch {
      setIsWorkerReady(false);
      appendLog('worker', 'worker failed during initialization.');
    }
  }, [appendLog]);

  // 页面挂载时初始化；卸载时销毁
  useEffect(() => {
    void setupManager();

    return () => {
      managerRef.current?.terminate();
      managerRef.current = null;
      setIsWorkerReady(false);
    };
  }, [setupManager]);

  // 发起一个 Promise 化 worker 请求
  const handleRunTask = useCallback(async () => {
    const manager = managerRef.current;
    const normalized = payload.trim();

    if (!manager || !isWorkerReady || !normalized) {
      return;
    }

    setIsRunning(true);
    appendLog('main', `request -> [${action}] ${normalized}`);

    try {
      const result = await manager.request(action, normalized);
      appendLog(
        'worker',
        `response -> [${result.action}] ${result.data} (${result.duration.toFixed(2)}ms)`,
      );
    } catch (error) {
      appendLog('worker', `error -> ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }, [action, appendLog, isWorkerReady, payload]);

  // 清空日志，便于重新观察
  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <div>
      <Typography.Title level={2}>Demo 2 - Worker Manager + Promise 化请求</Typography.Title>
      <Space style={{ marginBottom: 8 }}>
        <Tag color={isWorkerReady ? 'green' : 'red'}>
          {isWorkerReady ? 'Worker Ready' : 'Worker Stopped'}
        </Tag>
        <Button onClick={handleClearLogs}>清空日志</Button>
      </Space>
      <Divider />

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Select
              style={{ width: 240 }}
              options={ACTION_OPTIONS}
              value={action}
              onChange={(value) => {
                setAction(value);
                setPayload(DEFAULT_PAYLOAD_BY_ACTION[value]);
              }}
            />
            <Input
              style={{ width: 420 }}
              value={payload}
              placeholder="输入任意字符串"
              onChange={(event) => setPayload(event.target.value)}
              onPressEnter={() => {
                void handleRunTask();
              }}
            />
            <Button
              type="primary"
              loading={isRunning}
              onClick={() => {
                void handleRunTask();
              }}
              disabled={!payload.trim() || !isWorkerReady}
            >
              Run Worker Task
            </Button>
          </Space>

          <Divider style={{ margin: '8px 0' }}>Message Log</Divider>
          <ol>
            {logs.map((log) => (
              <li key={log.id}>
                <Typography.Text type={log.from === 'worker' ? 'success' : undefined}>
                  [{log.from}] {log.text}
                </Typography.Text>
              </li>
            ))}
          </ol>
        </Space>
      </Card>
    </div>
  );
};

export default Demo2;
