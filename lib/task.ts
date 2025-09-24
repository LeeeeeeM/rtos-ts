import { TaskControlBlock, TaskState, TaskHandle, TaskFunction, TaskPriority } from './types';

/**
 * 任务管理类
 */
export class TaskManager {
  private tasks: Map<TaskHandle, TaskControlBlock> = new Map();
  private nextHandle: TaskHandle = 1;
  private currentTask: TaskHandle | null = null;
  private readyList: TaskHandle[] = [];
  private blockedList: TaskHandle[] = [];
  private suspendedList: TaskHandle[] = [];

  /**
   * 创建新任务
   */
  createTask(
    name: string,
    taskFunction: TaskFunction,
    priority: TaskPriority,
    stackSize: number,
    params?: any
  ): TaskHandle {
    const handle = this.nextHandle++;
    const stack = new ArrayBuffer(stackSize);
    
    // 检查是否为 Generator 函数
    const isGenerator = taskFunction.constructor.name === 'GeneratorFunction' || 
                       taskFunction.toString().includes('function*') ||
                       taskFunction.toString().includes('function *');
    let generator: Generator<any, any, any> | undefined;
    
    
    if (isGenerator) {
      try {
        generator = taskFunction() as Generator<any, any, any>;
      } catch (error) {
        console.error('创建 Generator 时出错:', error);
        // 如果创建 Generator 失败，将其视为普通函数
      }
    }

    const tcb: TaskControlBlock = {
      handle,
      name,
      function: taskFunction,
      params,
      state: TaskState.READY,
      priority,
      stackPointer: 0,
      stackSize,
      stack,
      delayTicks: 0,
      blockedOn: null,
      createdTime: Date.now(),
      lastRunTime: 0,
      runCount: 0,
      generator: generator,
      isGenerator
    };

    this.tasks.set(handle, tcb);
    this.addToReadyList(handle);
    
    return handle;
  }

  /**
   * 删除任务
   */
  deleteTask(handle: TaskHandle): boolean {
    const task = this.tasks.get(handle);
    if (!task) {
      return false;
    }

    // 从所有列表中移除
    this.removeFromReadyList(handle);
    this.removeFromBlockedList(handle);
    this.removeFromSuspendedList(handle);

    // 如果删除的是当前任务，清空当前任务
    if (this.currentTask === handle) {
      this.currentTask = null;
    }

    this.tasks.delete(handle);
    return true;
  }

  /**
   * 挂起任务
   */
  suspendTask(handle: TaskHandle): boolean {
    const task = this.tasks.get(handle);
    if (!task || task.state === TaskState.SUSPENDED) {
      return false;
    }

    // 从当前状态列表中移除
    this.removeFromReadyList(handle);
    this.removeFromBlockedList(handle);

    // 更新状态
    task.state = TaskState.SUSPENDED;
    this.suspendedList.push(handle);

    return true;
  }

  /**
   * 恢复任务
   */
  resumeTask(handle: TaskHandle): boolean {
    const task = this.tasks.get(handle);
    if (!task || task.state !== TaskState.SUSPENDED) {
      return false;
    }

    // 从挂起列表中移除
    this.removeFromSuspendedList(handle);

    // 恢复到就绪状态
    task.state = TaskState.READY;
    this.addToReadyList(handle);

    return true;
  }

  /**
   * 阻塞任务
   */
  blockTask(handle: TaskHandle, reason: string): boolean {
    const task = this.tasks.get(handle);
    if (!task || (task.state !== TaskState.READY && task.state !== TaskState.RUNNING)) {
      return false;
    }

    // 从就绪列表中移除（如果任务在就绪列表中）
    this.removeFromReadyList(handle);

    // 更新状态
    task.state = TaskState.BLOCKED;
    task.blockedOn = reason;
    this.blockedList.push(handle);

    return true;
  }

  /**
   * 解除任务阻塞
   */
  unblockTask(handle: TaskHandle): boolean {
    const task = this.tasks.get(handle);
    if (!task || task.state !== TaskState.BLOCKED) {
      return false;
    }

    // 从阻塞列表中移除
    this.removeFromBlockedList(handle);

    // 恢复到就绪状态
    task.state = TaskState.READY;
    task.blockedOn = null;
    this.addToReadyList(handle);

    return true;
  }

  /**
   * 设置任务优先级
   */
  setTaskPriority(handle: TaskHandle, priority: TaskPriority): boolean {
    const task = this.tasks.get(handle);
    if (!task) {
      return false;
    }

    task.priority = priority;
    
    // 如果任务在就绪列表中，需要重新排序
    if (task.state === TaskState.READY) {
      this.removeFromReadyList(handle);
      this.addToReadyList(handle);
    }

    return true;
  }

  /**
   * 获取任务信息
   */
  getTaskInfo(handle: TaskHandle): TaskControlBlock | null {
    return this.tasks.get(handle) || null;
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): TaskControlBlock[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取当前运行任务
   */
  getCurrentTask(): TaskHandle | null {
    return this.currentTask;
  }

  /**
   * 获取就绪任务列表
   */
  getReadyTasks(): TaskHandle[] {
    return [...this.readyList];
  }

  /**
   * 获取阻塞任务列表
   */
  getBlockedTasks(): TaskHandle[] {
    return [...this.blockedList];
  }

  /**
   * 获取挂起任务列表
   */
  getSuspendedTasks(): TaskHandle[] {
    return [...this.suspendedList];
  }

  /**
   * 添加任务到就绪列表（按优先级排序）
   */
  private addToReadyList(handle: TaskHandle): void {
    const task = this.tasks.get(handle);
    if (!task) return;

    // 按优先级插入到正确位置
    let insertIndex = 0;
    for (let i = 0; i < this.readyList.length; i++) {
      const readyTaskHandle = this.readyList[i];
      if (readyTaskHandle !== undefined) {
        const readyTask = this.tasks.get(readyTaskHandle);
        if (readyTask && task.priority > readyTask.priority) {
          insertIndex = i;
          break;
        }
      }
      insertIndex = i + 1;
    }

    this.readyList.splice(insertIndex, 0, handle);
  }

  /**
   * 从就绪列表中移除任务
   */
  private removeFromReadyList(handle: TaskHandle): void {
    const index = this.readyList.indexOf(handle);
    if (index !== -1) {
      this.readyList.splice(index, 1);
    }
  }

  /**
   * 从阻塞列表中移除任务
   */
  private removeFromBlockedList(handle: TaskHandle): void {
    const index = this.blockedList.indexOf(handle);
    if (index !== -1) {
      this.blockedList.splice(index, 1);
    }
  }

  /**
   * 从挂起列表中移除任务
   */
  private removeFromSuspendedList(handle: TaskHandle): void {
    const index = this.suspendedList.indexOf(handle);
    if (index !== -1) {
      this.suspendedList.splice(index, 1);
    }
  }

  /**
   * 获取下一个要运行的任务
   */
  getNextTask(): TaskHandle | null {
    if (this.readyList.length === 0) {
      return null;
    }

    // 返回优先级最高的就绪任务
    return this.readyList[0] || null;
  }

  /**
   * 设置当前运行任务
   */
  setCurrentTask(handle: TaskHandle | null): void {
    this.currentTask = handle;
    
    if (handle) {
      const task = this.tasks.get(handle);
      if (task && task.state !== TaskState.BLOCKED) {
        // 只有非阻塞的任务才设置为运行状态
        task.state = TaskState.RUNNING;
        task.lastRunTime = Date.now();
        task.runCount++;
      }
    }
  }

  /**
   * 将当前任务放回就绪列表
   */
  yieldCurrentTask(): void {
    if (this.currentTask) {
      const task = this.tasks.get(this.currentTask);
      if (task && task.state === TaskState.RUNNING) {
        task.state = TaskState.READY;
        // 检查任务是否已经在就绪列表中，避免重复添加
        if (!this.readyList.includes(this.currentTask)) {
          this.addToReadyList(this.currentTask);
        }
        this.currentTask = null;
      }
    }
  }
}
