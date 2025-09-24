# TypeScript 实时操作系统 (RTOS)

一个用 TypeScript 实现的类似 FreeRTOS 的实时操作系统，支持任务调度、优先级管理、任务挂起恢复等功能。

## 特性

- ✅ **任务管理**: 支持任务的创建、删除、挂起、恢复
- ✅ **任务状态**: 就绪态、运行态、阻塞态、挂起态
- ✅ **优先级调度**: 基于优先级的抢占式调度
- ✅ **延时功能**: 基于时钟节拍的精确延时
- ✅ **任务解析器**: 自动将普通函数转换为 Generator 函数
- ✅ **状态监控**: 实时监控系统状态和任务信息
- ✅ **类型安全**: 完整的 TypeScript 类型定义
- ✅ **Web 演示**: 基于 React 的交互式演示界面

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

## 快速开始

```typescript
import { RTOS, SchedulerConfig } from './lib/rtos';

// 配置调度器
const config: SchedulerConfig = {
  maxTasks: 10,
  tickRate: 10, // 10 Hz
  stackSize: 4096,
  idleTaskStackSize: 1024
};

// 创建RTOS实例
const rtos = new RTOS(config);

// 创建任务
const taskHandle = rtos.createTask(
  () => {
    console.log('任务开始运行');
    rtos.delay(10); // 延时1秒
    console.log('任务完成');
  },
  5, // 优先级
  2048, // 栈大小
  undefined, // 参数
  'MyTask' // 任务名称
);

// 启动调度器
rtos.start();

// 挂起任务
rtos.suspendTask(taskHandle);

// 恢复任务
rtos.resumeTask(taskHandle);

// 删除任务
rtos.deleteTask(taskHandle);
```

## 任务状态

- **就绪态 (READY)**: 任务准备运行，等待调度器分配CPU
- **运行态 (RUNNING)**: 任务正在执行
- **阻塞态 (BLOCKED)**: 任务等待延时或其他事件
- **挂起态 (SUSPENDED)**: 任务被手动挂起，不会参与调度

## API 参考

### 任务管理

```typescript
// 创建任务
createTask(taskFunction: () => void, priority: number, stackSize?: number, params?: any, name?: string): TaskHandle

// 删除任务
deleteTask(handle: TaskHandle): boolean

// 挂起任务
suspendTask(handle: TaskHandle): boolean

// 恢复任务
resumeTask(handle: TaskHandle): boolean

// 设置任务优先级
setTaskPriority(handle: TaskHandle, priority: number): boolean

// 任务延时
delay(ticks: number): { delayTicks: number }
delayMs(ms: number): { delayTicks: number }

// 任务让出CPU
yield(): void
```

### 系统状态

```typescript
// 获取系统状态
getSystemStatus(): SystemStatus

// 获取任务信息
getTaskInfo(handle: TaskHandle): TaskControlBlock | null

// 获取所有任务
getAllTasks(): TaskControlBlock[]

// 获取时钟节拍数
getTickCount(): number
```

### 状态变化监听

```typescript
// 监听状态变化
onStateChange(callback: (status: SystemStatus) => void): () => void
```

## 演示页面

访问 http://localhost:3000 查看交互式演示：

1. **基本任务调度** (`/basic`): 演示任务创建、优先级调度和延时功能
2. **任务挂起** (`/suspend`): 演示任务的挂起、恢复和删除功能
3. **任务解析器** (`/task-parser`): 演示任务解析和状态监控功能

## 项目结构

```
scheduler-ts/
├── lib/                  # RTOS 核心库代码
│   ├── types.ts          # 类型定义
│   ├── task.ts           # 任务管理
│   ├── scheduler.ts      # 调度器核心
│   ├── parser.ts         # 任务解析器
│   └── rtos.ts           # 主入口
├── src/                  # React 应用代码
│   ├── components/       # React 组件
│   │   ├── BasicExample.tsx      # 基本任务调度演示
│   │   ├── SuspendExample.tsx    # 任务挂起演示
│   │   └── TaskParserExample.tsx # 任务解析器演示
│   ├── App.tsx           # 主应用组件
│   ├── App.module.css    # 样式文件
│   └── main.tsx          # 应用入口
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

# 运行测试
npm run test               # 运行测试（监听模式）
npm run test:run           # 运行测试（单次）
npm run test:coverage      # 生成覆盖率报告

# 代码质量
npm run lint               # 代码检查
npm run lint:fix           # 自动修复代码问题
npm run type-check         # 类型检查

# 其他
npm run preview            # 预览构建结果
```

## 技术特点

### 任务解析器
- 自动将普通 JavaScript 函数转换为 Generator 函数
- 支持 `rtos.delay()` 调用的自动转换
- 保持代码的可读性和易用性

### 优先级调度
- 基于优先级的抢占式调度
- 高优先级任务优先执行
- 支持任务优先级动态调整

### 状态监控
- 实时监控系统状态
- 支持状态变化回调
- 提供详细的任务信息

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 注意事项

这是一个教学和演示用的 RTOS 实现，主要用于学习和理解实时操作系统的原理。在生产环境中使用前，请根据实际需求进行充分的测试和优化。