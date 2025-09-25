import { Scheduler } from './scheduler';
import { SchedulerConfig, TaskHandle } from './types';
import { RTOSParser } from './parser';

/**
 * 实时操作系统主类
 */
export class RTOS {
  private scheduler: Scheduler;
  private parser: RTOSParser;
  private taskCounter: number = 0;
  private yieldAllStatements: boolean = false;

  constructor(config: SchedulerConfig, options?: { yieldAllStatements?: boolean }) {
    this.scheduler = new Scheduler(config);
    this.yieldAllStatements = options?.yieldAllStatements || false;
    
    // 初始化解析器
    this.parser = new RTOSParser({ yieldAllStatements: this.yieldAllStatements });
  }

  /**
   * 启动操作系统
   */
  start(): void {
    this.scheduler.start();
  }

  /**
   * 停止操作系统
   */
  stop(): void {
    this.scheduler.stop();
  }

  /**
   * 设置 yield 模式
   * @param yieldAllStatements true: 所有语句转 yield, false: 仅 delay 转 yield
   */
  setYieldMode(yieldAllStatements: boolean): void {
    this.yieldAllStatements = yieldAllStatements;
    this.parser = new RTOSParser({ yieldAllStatements: this.yieldAllStatements });
  }

  /**
   * 获取当前 yield 模式
   */
  getYieldMode(): boolean {
    return this.yieldAllStatements;
  }

  // 任务管理接口
  createTask(
    taskFunction: (rtos: RTOS) => void,
    priority: number,
    stackSize?: number,
    params?: any,
    name?: string
  ): TaskHandle {
    // 如果没有提供名称，使用自增 ID 生成任务名称
    const taskName = name || `Task_${++this.taskCounter}`;
    
    // 使用解析器转换任务函数为 Generator
    const transformedFunction = this.parser.transformTaskFunction(taskFunction);
    
    // 创建 log 函数，用于在任务中输出日志
    const log = (message: string) => {
      console.log(`[${taskName}] ${message}`);
    };
    
    // 直接调用转换后的函数，获取 Generator 函数
    const generatorFunction = transformedFunction(this, console, log);
    
    // 创建转换后的任务，直接传递 Generator 函数
    return this.scheduler.createTask(taskName, generatorFunction, priority, stackSize, params);
  }

  deleteTask(handle: TaskHandle): boolean {
    return this.scheduler.deleteTask(handle);
  }

  suspendTask(handle: TaskHandle): boolean {
    return this.scheduler.suspendTask(handle);
  }

  resumeTask(handle: TaskHandle): boolean {
    return this.scheduler.resumeTask(handle);
  }

  delay(ticks: number): { delayTicks: number } {
    return this.scheduler.delay(ticks);
  }

  delayMs(ms: number): { delayTicks: number } {
    return this.scheduler.delayMs(ms);
  }

  yield(): void {
    this.scheduler.yield();
  }

  setTaskPriority(handle: TaskHandle, priority: number): boolean {
    return this.scheduler.setTaskPriority(handle, priority);
  }


  // 系统状态
  getSystemStatus() {
    return this.scheduler.getSystemStatus();
  }

  getTaskInfo(handle: TaskHandle) {
    return this.scheduler.getTaskInfo(handle);
  }

  getAllTasks() {
    return this.scheduler.getAllTasks();
  }

  getTickCount(): number {
    return this.scheduler.getTickCount();
  }
}

// 导出所有类型和类
export * from './types';
export { Scheduler } from './scheduler';
export { TaskManager } from './task';
