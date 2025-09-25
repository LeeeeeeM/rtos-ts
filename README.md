# TypeScript 实时操作系统 (RTOS)

一个用 TypeScript 实现的类似 FreeRTOS 的实时操作系统，支持任务调度、优先级管理、任务挂起恢复等功能。提供完整的 Web 演示界面，支持代码编辑和实时执行。

## ✨ 特性

- ✅ **任务管理**: 支持任务的创建、删除、挂起、恢复
- ✅ **任务状态**: 就绪态、运行态、阻塞态、挂起态
- ✅ **优先级调度**: 基于优先级的抢占式调度，支持轮询调度
- ✅ **延时功能**: 基于时钟节拍的精确延时
- ✅ **智能解析器**: 使用 Acorn AST 解析器，自动将普通函数转换为 Generator 函数
- ✅ **双模式转换**: 支持"仅 delay 转 yield"和"所有语句转 yield"两种模式
- ✅ **状态监控**: 实时监控系统状态和任务信息
- ✅ **类型安全**: 完整的 TypeScript 类型定义
- ✅ **Web 演示**: 基于 React + Ant Design 的交互式演示界面
- ✅ **代码编辑**: 支持在线编辑任务代码并实时执行
- ✅ **日志系统**: 全局日志捕获和显示系统

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

## 🚀 快速开始

### 基本用法

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

// 创建任务 - 现在支持 rtos 参数传递
const taskHandle = rtos.createTask(
  (rtos) => {
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

### 双模式转换

```typescript
// 创建支持双模式的 RTOS 实例
const rtos = new RTOS(config, { yieldAllStatements: true });

// 动态切换模式
rtos.setYieldMode(true);  // 所有语句转 yield
rtos.setYieldMode(false); // 仅 delay 转 yield

// 获取当前模式
const currentMode = rtos.getYieldMode();
```

### 代码字符串执行

```typescript
// 从代码字符串创建任务
const taskCode = `
rtos.createTask((rtos) => {
    console.log("任务A开始");
    rtos.delay(20);
    console.log("任务A完成");
}, 10, 2048, undefined, 'TaskA');
`;

// 执行代码字符串
const executeCode = new Function('rtos', 'console', taskCode);
executeCode(rtos, console);
```

## 任务状态

- **就绪态 (READY)**: 任务准备运行，等待调度器分配CPU
- **运行态 (RUNNING)**: 任务正在执行
- **阻塞态 (BLOCKED)**: 任务等待延时或其他事件
- **挂起态 (SUSPENDED)**: 任务被手动挂起，不会参与调度

## 📚 API 参考

### 任务管理

```typescript
// 创建任务 - 支持 rtos 参数传递
createTask(taskFunction: (rtos: RTOS) => void, priority: number, stackSize?: number, params?: any, name?: string): TaskHandle

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

### Yield 模式控制

```typescript
// 设置 yield 模式
setYieldMode(yieldAllStatements: boolean): void

// 获取当前 yield 模式
getYieldMode(): boolean

// 构造函数中设置模式
new RTOS(config: SchedulerConfig, options?: { yieldAllStatements?: boolean })
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

## 🎮 演示页面

访问 http://localhost:3000 查看交互式演示：

### 📋 页面列表

1. **基本任务调度** (`/basic`): 演示任务创建、优先级调度和延时功能
   - 支持高、中、低三个优先级任务的代码编辑
   - 实时查看任务执行状态
   - 支持任务代码的在线编辑和执行

2. **任务挂起** (`/suspend`): 演示任务的挂起、恢复和删除功能
   - 支持任务代码编辑
   - 动态控制任务的挂起、恢复和删除
   - 实时监控任务状态变化

3. **任务调度** (`/task`): 演示任务解析和状态监控功能
   - 支持任务代码编辑和执行
   - 实时监控系统状态
   - 展示任务解析器的转换效果

4. **代码转换** (`/code-transform`): 演示代码转换功能
   - 支持两种转换模式：仅 delay 转 yield 和所有语句转 yield
   - 实时查看转换后的代码
   - 支持代码的在线编辑和转换

5. **任务执行模式** (`/task-mode`): 演示不同执行模式的效果
   - 支持全部 yield 模式和 delay yield 模式
   - 实时对比两种模式的执行效果
   - 支持多任务并发执行演示

### 🌟 特色功能

- **全局日志系统**: 右上角悬浮日志容器，实时显示所有 console 输出
- **代码编辑**: 所有页面都支持在线编辑任务代码
- **实时执行**: 编辑代码后可直接执行，无需刷新页面
- **状态监控**: 实时显示系统运行状态、任务数量、时钟节拍等信息

## 📁 项目结构

```
scheduler-ts/
├── lib/                          # RTOS 核心库代码
│   ├── types.ts                  # 类型定义
│   ├── task.ts                   # 任务管理（支持轮询调度）
│   ├── scheduler.ts              # 调度器核心
│   ├── parser.ts                 # 智能解析器（基于 Acorn AST）
│   └── rtos.ts                   # 主入口（支持双模式）
├── src/                          # React 应用代码
│   ├── components/               # React 组件
│   │   └── LogContainer.tsx      # 全局日志容器
│   ├── contexts/                 # React Context
│   │   └── LogContext.tsx        # 日志状态管理
│   ├── pages/                    # 页面组件
│   │   ├── basic/                # 基本任务调度演示
│   │   ├── suspend/              # 任务挂起演示
│   │   ├── task/                 # 任务调度演示
│   │   ├── code-transform/       # 代码转换演示
│   │   └── task-mode/            # 任务执行模式演示
│   ├── App.tsx                   # 主应用组件
│   ├── App.module.css            # 样式文件
│   └── main.tsx                  # 应用入口
├── tests/                        # 测试文件
│   ├── rtos.test.ts              # RTOS 测试（76个测试）
│   ├── task.test.ts              # 任务管理测试
│   ├── scheduler.test.ts          # 调度器测试
│   └── parser.test.ts            # 解析器测试
├── index.html                    # HTML 入口
├── dist/                         # 编译输出
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 项目配置
└── README.md                     # 项目文档
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

## 🔧 技术特点

### 🧠 智能解析器
- **基于 Acorn AST**: 使用轻量级的 Acorn 解析器进行代码分析
- **自动转换**: 自动将普通 JavaScript 函数转换为 Generator 函数
- **双模式支持**: 
  - 仅 delay 转 yield：只转换 `rtos.delay()` 调用
  - 所有语句转 yield：将所有语句都转换为 yield 表达式
- **参数验证**: 智能检测 delay 调用是否使用了正确的参数
- **错误处理**: 完善的错误处理和警告机制

### ⚡ 优先级调度
- **抢占式调度**: 基于优先级的抢占式调度算法
- **轮询调度**: 相同优先级任务支持轮询调度
- **动态调整**: 支持任务优先级动态调整
- **状态管理**: 完整的任务状态生命周期管理

### 📊 状态监控
- **实时监控**: 实时监控系统状态和任务信息
- **状态回调**: 支持状态变化回调机制
- **详细信息**: 提供详细的任务信息和统计数据
- **可视化界面**: 基于 React + Ant Design 的可视化界面

### 🌐 Web 集成
- **现代技术栈**: React 18 + TypeScript + Vite + Ant Design
- **响应式设计**: 支持各种屏幕尺寸的响应式设计
- **实时交互**: 支持代码编辑和实时执行
- **全局日志**: 统一的日志捕获和显示系统

## 🧪 测试

项目包含完整的测试套件，覆盖所有核心功能：

```bash
# 运行所有测试
npm test

# 运行测试（单次）
npm run test:run

# 生成覆盖率报告
npm run test:coverage
```

### 测试覆盖

- **RTOS 核心**: 16个测试，覆盖基本功能、任务管理、Yield 模式控制
- **任务管理**: 21个测试，覆盖任务创建、状态管理、调度算法
- **调度器**: 13个测试，覆盖调度逻辑、状态监控
- **解析器**: 26个测试，覆盖代码转换、错误处理、边界条件

**总计**: 76个测试，100% 通过率 ✅

## 🚀 部署

### GitHub Pages

项目已配置 GitHub Pages 自动部署：

```bash
# 手动部署到 GitHub Pages
npm run deploy
```

访问地址：https://yourusername.github.io/scheduler-ts

### 本地部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📦 依赖

### 核心依赖
- `acorn` - AST 解析器
- `acorn-walk` - AST 遍历工具

### 开发依赖
- `typescript` - TypeScript 支持
- `vite` - 构建工具
- `vitest` - 测试框架
- `react` + `antd` - UI 框架
- `eslint` - 代码检查

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

MIT License

## ⚠️ 注意事项

这是一个教学和演示用的 RTOS 实现，主要用于学习和理解实时操作系统的原理。在生产环境中使用前，请根据实际需求进行充分的测试和优化。

## 🎯 学习目标

通过这个项目，你可以学习到：

- 实时操作系统的基本概念和原理
- 任务调度算法的实现
- Generator 函数在异步编程中的应用
- AST 解析和代码转换技术
- TypeScript 在复杂项目中的应用
- React 状态管理和组件设计
- 现代前端工程化实践