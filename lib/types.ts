/**
 * 任务状态枚举
 */
export const TaskState = {
  READY: 'ready',      // 就绪态
  RUNNING: 'running',  // 运行态
  BLOCKED: 'blocked',  // 阻塞态
  SUSPENDED: 'suspended' // 挂起态
} as const;

export type TaskStateType = typeof TaskState[keyof typeof TaskState];

/**
 * 任务优先级
 */
export type TaskPriority = number;

/**
 * 任务句柄
 */
export type TaskHandle = number;

/**
 * 任务函数类型 - 支持普通函数和 Generator 函数
 * 现在接受 rtos 作为参数
 */
export type TaskFunction = (rtos: any) => void | Generator<any, any, any>;

/**
 * 任务控制块 (Task Control Block)
 */
export interface TaskControlBlock {
  handle: TaskHandle;           // 任务句柄
  name: string;                 // 任务名称
  function: TaskFunction;       // 任务函数
  params?: any;                 // 任务参数
  state: TaskStateType;         // 任务状态
  priority: TaskPriority;       // 任务优先级
  stackPointer: number;         // 栈指针
  stackSize: number;            // 栈大小
  stack: ArrayBuffer;           // 任务栈
  delayTicks: number;           // 延时计数
  blockedOn: string | null;     // 阻塞原因
  createdTime: number;          // 创建时间
  lastRunTime: number;          // 最后运行时间
  runCount: number;             // 运行次数
  generator: Generator<any, any, any> | undefined; // Generator 对象
  isGenerator: boolean;         // 是否为 Generator 任务
}

/**
 * 调度器配置
 */
export interface SchedulerConfig {
  maxTasks: number;             // 最大任务数
  tickRate: number;             // 时钟节拍率 (Hz)
  stackSize: number;            // 默认栈大小
  idleTaskStackSize: number;    // 空闲任务栈大小
}


/**
 * 定时器
 */
export interface Timer {
  id: number;
  period: number;
  callback: () => void;
  isActive: boolean;
  isAutoReload: boolean;
  remainingTicks: number;
}
