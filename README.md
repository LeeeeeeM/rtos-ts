# TypeScript 实时操作系统 (RTOS)

一个用 TypeScript 实现的类似 FreeRTOS 的实时操作系统，支持任务调度、同步机制、定时器等功能。

## 特性

- ✅ **任务管理**: 支持任务的创建、删除、挂起、恢复
- ✅ **任务状态**: 就绪态、运行态、阻塞态、挂起态
- ✅ **优先级调度**: 基于优先级的抢占式调度
- ✅ **同步机制**: 信号量、互斥锁、队列
- ✅ **定时器**: 单次和周期性定时器
- ✅ **延时功能**: 基于时钟节拍的精确延时
- ✅ **类型安全**: 完整的 TypeScript 类型定义

## 安装

```bash
npm install
```

## 开发

```bash
# 启动开发服务器（带热重载）
npm run dev

# 在浏览器中打开 http://localhost:3000 查看演示
```

## 构建

```bash
# 构建库文件
npm run build:lib

# 构建演示应用
npm run build
```

## 运行示例

```bash
# 在浏览器中查看交互式演示
npm run dev
# 访问 http://localhost:3000 查看完整的 React 演示应用
```

## 测试

```bash
# 运行测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:run

# 打开测试UI界面
npm run test:ui
```

## 快速开始

```typescript
import { RTOS, SchedulerConfig } from './lib/rtos';

// 配置调度器
const config: SchedulerConfig = {
  maxTasks: 10,
  tickRate: 1000, // 1000 Hz
  stackSize: 4096,
  idleTaskStackSize: 1024
};

// 创建RTOS实例
const rtos = new RTOS(config);

// 创建任务
const task1 = rtos.createTask(
  'Task1',
  () => {
    console.log('Task1 运行');
    rtos.delayMs(1000); // 延时1秒
  },
  5, // 优先级
  2048 // 栈大小
);

// 启动调度器
rtos.start();
```

## 任务状态

- **就绪态 (READY)**: 任务准备运行，等待调度器分配CPU
- **运行态 (RUNNING)**: 任务正在执行
- **阻塞态 (BLOCKED)**: 任务等待某个事件（如信号量、延时等）
- **挂起态 (SUSPENDED)**: 任务被手动挂起，不会参与调度

## API 参考

### 任务管理

```typescript
// 创建任务
createTask(name: string, taskFunction: () => void, priority: number, stackSize?: number, params?: any): TaskHandle

// 删除任务
deleteTask(handle: TaskHandle): boolean

// 挂起任务
suspendTask(handle: TaskHandle): boolean

// 恢复任务
resumeTask(handle: TaskHandle): boolean

// 设置任务优先级
setTaskPriority(handle: TaskHandle, priority: number): boolean

// 任务延时
delay(ticks: number): void
delayMs(ms: number): void

// 任务让出CPU
yield(): void
```

### 信号量

```typescript
// 创建信号量
createSemaphore(name: string, initialCount?: number, maxCount?: number): boolean

// 获取信号量
takeSemaphore(name: string, timeout?: number): boolean

// 释放信号量
giveSemaphore(name: string): boolean
```

### 互斥锁

```typescript
// 创建互斥锁
createMutex(name: string): boolean

// 获取互斥锁
takeMutex(name: string, timeout?: number): boolean

// 释放互斥锁
giveMutex(name: string): boolean
```

### 队列

```typescript
// 创建队列
createQueue<T>(name: string, maxSize: number): boolean

// 发送数据
sendToQueue<T>(name: string, data: T, timeout?: number): boolean

// 接收数据
receiveFromQueue<T>(name: string, timeout?: number): T | null
```

### 定时器

```typescript
// 创建定时器
createTimer(period: number, callback: () => void, isAutoReload?: boolean): number

// 启动定时器
startTimer(id: number): boolean

// 停止定时器
stopTimer(id: number): boolean

// 删除定时器
deleteTimer(id: number): boolean
```

## 项目结构

```
scheduler-ts/
├── lib/                  # RTOS 核心库代码
│   ├── types.ts          # 类型定义
│   ├── task.ts           # 任务管理
│   ├── scheduler.ts      # 调度器核心
│   ├── sync.ts           # 同步机制
│   ├── timer.ts          # 定时器
│   └── rtos.ts           # 主入口
├── src/                  # React 应用代码
│   ├── components/       # React 组件
│   │   ├── BasicExample.tsx
│   │   ├── SemaphoreExample.tsx
│   │   ├── MutexExample.tsx
│   │   ├── QueueExample.tsx
│   │   ├── TimerExample.tsx
│   │   ├── MonitorExample.tsx
│   │   └── YieldExample.tsx
│   ├── App.tsx           # 主应用组件
│   ├── App.module.css    # 样式文件
│   └── main.tsx          # 应用入口
├── tests/                # 测试文件
├── index.html            # HTML 入口
├── dist/                 # 编译输出
└── README.md
```

## 开发命令

```bash
# 开发模式（监听文件变化，热重载）
npm run dev

# 构建项目
npm run build              # 构建演示应用
npm run build:lib          # 构建库文件
npm run build:types        # 生成类型定义文件

# 运行测试
npm run test               # 运行测试（监听模式）
npm run test:run           # 运行测试（单次）
npm run test:ui            # 打开测试UI界面
npm run test:coverage      # 生成覆盖率报告

# 代码质量
npm run lint               # 代码检查
npm run lint:fix           # 自动修复代码问题
npm run type-check         # 类型检查

# 其他
npm run preview            # 预览构建结果
npm run clean              # 清理构建文件
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 注意事项

这是一个教学和演示用的 RTOS 实现，主要用于学习和理解实时操作系统的原理。在生产环境中使用前，请根据实际需求进行充分的测试和优化。
