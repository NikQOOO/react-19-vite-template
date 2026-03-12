import { useCallback, useEffect, useRef, useState } from 'react';
import { MSG_TYPE } from '../constants';
import type { MainToWorkerMessage, WorkerToMainMessage } from '../typing';

const useWorker = () => {
  const [workerReady, setWorkerReady] = useState(false);
  const [mainThreadLogs, setMainThreadLogs] = useState<WorkerToMainMessage[]>([]);
  const [workerLogs, setWorkerLogs] = useState<MainToWorkerMessage[]>([]);

  const workerInstance = useRef<Worker | null>(null);
  const workerId = useRef(1);

  const emitLogToMainThread = useCallback((log: WorkerToMainMessage) => {
    setMainThreadLogs((prevLogs) => [...prevLogs, log]);
  }, []);

  const sendTaskToWorker = useCallback((message: MainToWorkerMessage) => {}, []);

  const handleWorkerMessage = useCallback((event: MessageEvent) => {
    const { msgType, content, progress } = event.data;
  }, []);

  const handleWorkerError = useCallback((error: ErrorEvent) => {
    const errorLog: WorkerToMainMessage = {
      msgType: MSG_TYPE.ERROR,
      payload: error.message,
    };

    setMainThreadLogs((prevLogs) => [...prevLogs, errorLog]);
  }, []);

  useEffect(() => {
    return () => {
      workerInstance.current?.terminate();
      workerInstance.current = null;
    };
  }, []);

  return { workerReady, mainThreadLogs, workerLogs };
};

export default useWorker;
