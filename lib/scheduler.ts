import { TaskManager } from './task';
import { SchedulerConfig, TaskHandle, TaskState } from './types';

/**
 * 实时操作系统调度器
 */
export class Scheduler {
  private taskManager: TaskManager;
  private config: SchedulerConfig;
  private isRunning: boolean = false;
  private tickCount: number = 0;
  private tickInterval: any = null;
  private idleTaskHandle: TaskHandle | null = null;
  private currentTaskIndex: number = 0; // 当前任务索引，用于轮转调度

  constructor(config: SchedulerConfig) {
    this.config = config;
    this.taskManager = new TaskManager();
    this.setupIdleTask();
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.tickCount = 0;

    // 启动时钟节拍
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1000 / this.config.tickRate);

    console.log('调度器已启动');
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    console.log('调度器已停止');
  }

  /**
   * 时钟节拍处理
   */
  private tick(): void {
    this.tickCount++;
    
    // 处理延时任务
    this.processDelayedTasks();
    
    // 执行任务调度
    this.schedule();
  }

  /**
   * 处理延时任务
   */
  private processDelayedTasks(): void {
    const allTasks = this.taskManager.getAllTasks();
    
    for (const task of allTasks) {
      if (task.state === TaskState.BLOCKED && task.delayTicks > 0) {
        task.delayTicks--;
        
        if (task.delayTicks === 0) {
          // 延时结束，恢复到就绪状态
          this.taskManager.unblockTask(task.handle);
        }
      }
    }
  }

  /**
   * 任务调度
   */
  private schedule(): void {
    const readyTasks = this.taskManager.getReadyTasks();
    
    if (readyTasks.length === 0) {
      // 没有就绪任务，运行空闲任务
      if (this.idleTaskHandle) {
        this.taskManager.setCurrentTask(this.idleTaskHandle);
        this.runTask(this.idleTaskHandle);
      }
      return;
    }

    // 轮转调度：选择下一个任务
    const nextTask = readyTasks[this.currentTaskIndex % readyTasks.length];
    if (nextTask === undefined) {
      return;
    }
    this.currentTaskIndex = (this.currentTaskIndex + 1) % readyTasks.length;

    const currentTask = this.taskManager.getCurrentTask();
    
    // 如果下一个任务与当前任务不同，进行任务切换
    if (currentTask !== nextTask) {
      if (currentTask) {
        // 保存当前任务状态并放回就绪列表
        this.taskManager.yieldCurrentTask();
      }
      
      // 切换到新任务
      this.taskManager.setCurrentTask(nextTask);
    }

    // 运行当前任务
    this.runTask(nextTask);
    
    // 检查任务是否被阻塞，如果被阻塞则不进行任务切换
    const taskAfterRun = this.taskManager.getTaskInfo(nextTask);
    if (taskAfterRun && taskAfterRun.state === TaskState.BLOCKED) {
      // 任务被阻塞，不进行任务切换
      return;
    }
  }

  /**
   * 运行任务
   */
  private runTask(handle: TaskHandle): void {
    const task = this.taskManager.getTaskInfo(handle);
    if (!task) {
      return;
    }

    try {
      if (task.isGenerator && task.generator) {
        try {
          // 执行 Generator 任务
          const result = task.generator.next();
          
          if (result.done) {
            // Generator 执行完成，删除任务
            this.taskManager.deleteTask(handle);
            return;
          }
          
          // 检查 yield 的值是否为 delay 调用
          if (result.value && typeof result.value === 'object' && result.value.delayTicks) {
            // 设置延时并阻塞任务
            task.delayTicks = result.value.delayTicks;
            this.taskManager.blockTask(handle, 'delay');
          }
        } catch (error) {
          console.error(`Generator 任务 ${task.name} 执行出错:`, error);
          // 删除出错的任务
          this.taskManager.deleteTask(handle);
        }
      } else {
        // 执行普通任务函数
        task.function(task.params);
      }
    } catch (error) {
      console.error(`任务 ${task.name} 执行出错:`, error);
    }
  }

  /**
   * 创建任务
   */
  createTask(
    name: string,
    taskFunction: () => void,
    priority: number,
    stackSize?: number,
    params?: any
  ): TaskHandle {
    const actualStackSize = stackSize || this.config.stackSize;
    return this.taskManager.createTask(name, taskFunction, priority, actualStackSize, params);
  }

  /**
   * 删除任务
   */
  deleteTask(handle: TaskHandle): boolean {
    return this.taskManager.deleteTask(handle);
  }

  /**
   * 挂起任务
   */
  suspendTask(handle: TaskHandle): boolean {
    return this.taskManager.suspendTask(handle);
  }

  /**
   * 恢复任务
   */
  resumeTask(handle: TaskHandle): boolean {
    return this.taskManager.resumeTask(handle);
  }

  /**
   * 延时任务 (纯 RTOS 阻塞调用)
   */
  delay(ticks: number): { delayTicks: number } {
    const currentTask = this.taskManager.getCurrentTask();
    if (!currentTask) {
      return { delayTicks: 0 };
    }

    const task = this.taskManager.getTaskInfo(currentTask);
    if (!task) {
      return { delayTicks: 0 };
    }

    // 返回延时信息，供 Generator 使用
    return { delayTicks: ticks };
  }

  /**
   * 延时毫秒 (纯 RTOS 阻塞调用)
   */
  delayMs(ms: number): { delayTicks: number } {
    const ticks = Math.ceil(ms * this.config.tickRate / 1000);
    return this.delay(ticks);
  }

  /**
   * 任务主动让出CPU
   */
  yield(): void {
    const currentTask = this.taskManager.getCurrentTask();
    if (!currentTask) {
      return;
    }

    // 将当前任务放回就绪列表末尾
    this.taskManager.yieldCurrentTask();
  }

  /**
   * 设置任务优先级
   */
  setTaskPriority(handle: TaskHandle, priority: number): boolean {
    return this.taskManager.setTaskPriority(handle, priority);
  }

  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      isRunning: this.isRunning,
      tickCount: this.tickCount,
      currentTask: this.taskManager.getCurrentTask(),
      readyTasks: this.taskManager.getReadyTasks().length,
      blockedTasks: this.taskManager.getBlockedTasks().length,
      suspendedTasks: this.taskManager.getSuspendedTasks().length,
      totalTasks: this.taskManager.getAllTasks().length
    };
  }

  /**
   * 获取任务信息
   */
  getTaskInfo(handle: TaskHandle) {
    return this.taskManager.getTaskInfo(handle);
  }

  /**
   * 获取所有任务信息
   */
  getAllTasks() {
    return this.taskManager.getAllTasks();
  }

  /**
   * 设置空闲任务
   */
  private setupIdleTask(): void {
    const idleTask = () => {
      // 空闲任务什么都不做，只是让出CPU
      this.yield();
    };

    this.idleTaskHandle = this.taskManager.createTask(
      'IdleTask',
      idleTask,
      0, // 最低优先级
      this.config.idleTaskStackSize
    );
  }

  /**
   * 获取当前时钟节拍
   */
  getTickCount(): number {
    return this.tickCount;
  }

  /**
   * 获取调度器配置
   */
  getConfig(): SchedulerConfig {
    return { ...this.config };
  }
}
