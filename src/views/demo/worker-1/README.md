# Web Worker 基础示例

一个简单的 Web Worker 对比演示，展示不同方式处理 CPU 密集型任务对 UI 响应的影响。

## 演示对比

| 方式                | 状态      | 说明                               |
| ------------------- | --------- | ---------------------------------- |
| **主线程同步执行**  | 🔴 阻塞   | 直接执行耗时任务，UI 完全冻结      |
| **Time Slice 分片** | 🟡 可接受 | 每 20ms 让出主线程，UI 保持可用    |
| **Web Worker**      | 🟢 流畅   | 任务在后台线程执行，主线程完全流畅 |

## 文件结构

```
worker-1/
├── index.tsx   # React 组件，包含三种方式的 UI 和交互逻辑
├── worker.ts   # Web Worker 线程，执行耗时任务
└── utils.ts    # 工具函数：CPU 占用、让出主线程、格式化时间
```

## 核心逻辑

### 1. 主线程同步执行

```ts
// 直接执行，阻塞 UI
burnCPU(5000); // 占用 CPU 5 秒
```

### 2. Time Slice 分片

```ts
// 分片执行，间歇让出主线程
while (!done) {
  burnCPU(20);           // 执行 20ms
  setSliceProgress(...); // 更新进度
  await yieldToMain();   // 让出主线程
}
```

### 3. Web Worker

```ts
// 主线程
const worker = new Worker(new URL('./worker.ts', import.meta.url));
worker.postMessage({ durationMs: 5000 });

// Worker 线程
self.onmessage = (e) => {
  burnCPU(e.data.durationMs);
  self.postMessage({ type: 'done', duration });
};
```

## 如何体验

1. 点击任意「运行」按钮启动任务
2. 在输入框中尝试输入文字
3. 观察 UI 响应差异：
   - **同步执行**：输入框无法响应，直到任务完成
   - **Time Slice**：输入框可用，但有轻微延迟
   - **Web Worker**：输入框完全流畅，无延迟

## 技术要点

- **CPU 模拟**：使用 `Math.sqrt` 循环模拟计算密集型任务
- **Time Slice（时间切片）**：将大任务拆分为小片段（20ms），通过 `setTimeout(0)` 让出主线程，避免阻塞 UI
- **消息通信**：Worker 通过 `postMessage` 与主线程通信
- **Vite 支持**：使用 `new URL('./worker.ts', import.meta.url)` 导入 Worker 模块
