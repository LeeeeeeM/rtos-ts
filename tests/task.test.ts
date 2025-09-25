import { describe, it, expect, beforeEach } from 'vitest';
import { TaskManager } from '../lib/task';
import { TaskState } from '../lib/types';

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
  });

  describe('基本功能', () => {
    it('应该能够创建 TaskManager 实例', () => {
      expect(taskManager).toBeDefined();
    });

    it('应该能够创建任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      expect(taskHandle).toBeGreaterThan(0);
      expect(taskManager.getAllTasks()).toHaveLength(1);
    });

    it('应该能够删除任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      expect(taskManager.getAllTasks()).toHaveLength(1);

      const result = taskManager.deleteTask(taskHandle);
      expect(result).toBe(true);
      expect(taskManager.getAllTasks()).toHaveLength(0);
    });

    it('应该能够获取任务信息', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      const taskInfo = taskManager.getTaskInfo(taskHandle);
      expect(taskInfo).toBeDefined();
      expect(taskInfo?.name).toBe('TestTask');
      expect(taskInfo?.priority).toBe(5);
      expect(taskInfo?.stackSize).toBe(2048);
      expect(taskInfo?.state).toBe(TaskState.READY);
    });
  });

  describe('任务状态管理', () => {
    it('应该能够挂起任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      const result = taskManager.suspendTask(taskHandle);
      expect(result).toBe(true);

      const taskInfo = taskManager.getTaskInfo(taskHandle);
      expect(taskInfo?.state).toBe(TaskState.SUSPENDED);
      expect(taskManager.getSuspendedTasks()).toHaveLength(1);
    });

    it('应该能够恢复任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      taskManager.suspendTask(taskHandle);
      expect(taskManager.getSuspendedTasks()).toHaveLength(1);

      const result = taskManager.resumeTask(taskHandle);
      expect(result).toBe(true);

      const taskInfo = taskManager.getTaskInfo(taskHandle);
      expect(taskInfo?.state).toBe(TaskState.READY);
      expect(taskManager.getSuspendedTasks()).toHaveLength(0);
    });

    it('应该能够阻塞任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      const result = taskManager.blockTask(taskHandle, 'delay');
      expect(result).toBe(true);

      const taskInfo = taskManager.getTaskInfo(taskHandle);
      expect(taskInfo?.state).toBe(TaskState.BLOCKED);
      expect(taskManager.getBlockedTasks()).toHaveLength(1);
    });

    it('应该能够解除阻塞任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      taskManager.blockTask(taskHandle, 'delay');
      expect(taskManager.getBlockedTasks()).toHaveLength(1);

      const result = taskManager.unblockTask(taskHandle);
      expect(result).toBe(true);

      const taskInfo = taskManager.getTaskInfo(taskHandle);
      expect(taskInfo?.state).toBe(TaskState.READY);
      expect(taskManager.getBlockedTasks()).toHaveLength(0);
    });
  });

  describe('任务列表管理', () => {
    it('应该能够获取就绪任务列表', () => {
      const taskHandle1 = taskManager.createTask('Task1', function* () { yield; }, 5, 2048, undefined);
      const taskHandle2 = taskManager.createTask('Task2', function* () { yield; }, 3, 2048, undefined);

      const readyTasks = taskManager.getReadyTasks();
      expect(readyTasks).toHaveLength(2);
      expect(readyTasks).toContain(taskHandle1);
      expect(readyTasks).toContain(taskHandle2);
    });

    it('应该能够获取阻塞任务列表', () => {
      const taskHandle1 = taskManager.createTask('Task1', function* () { yield; }, 5, 2048, undefined);
      const taskHandle2 = taskManager.createTask('Task2', function* () { yield; }, 3, 2048, undefined);

      taskManager.blockTask(taskHandle1, 'delay');
      taskManager.blockTask(taskHandle2, 'delay');

      const blockedTasks = taskManager.getBlockedTasks();
      expect(blockedTasks).toHaveLength(2);
      expect(blockedTasks).toContain(taskHandle1);
      expect(blockedTasks).toContain(taskHandle2);
    });

    it('应该能够获取挂起任务列表', () => {
      const taskHandle1 = taskManager.createTask('Task1', function* () { yield; }, 5, 2048, undefined);
      const taskHandle2 = taskManager.createTask('Task2', function* () { yield; }, 3, 2048, undefined);

      taskManager.suspendTask(taskHandle1);
      taskManager.suspendTask(taskHandle2);

      const suspendedTasks = taskManager.getSuspendedTasks();
      expect(suspendedTasks).toHaveLength(2);
      expect(suspendedTasks).toContain(taskHandle1);
      expect(suspendedTasks).toContain(taskHandle2);
    });
  });

  describe('任务优先级', () => {
    it('应该能够设置任务优先级', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      const result = taskManager.setTaskPriority(taskHandle, 10);
      expect(result).toBe(true);

      const taskInfo = taskManager.getTaskInfo(taskHandle);
      expect(taskInfo?.priority).toBe(10);
    });

    it('应该能够获取下一个要运行的任务（优先级最高的）', () => {
      const taskHandle1 = taskManager.createTask('Task1', function* () { yield; }, 5, 2048, undefined);
      const taskHandle2 = taskManager.createTask('Task2', function* () { yield; }, 10, 2048, undefined);
      const taskHandle3 = taskManager.createTask('Task3', function* () { yield; }, 3, 2048, undefined);

      const nextTask = taskManager.getNextTask();
      expect(nextTask).toBe(taskHandle2); // 优先级最高的任务
    });
  });

  describe('当前任务管理', () => {
    it('应该能够设置和获取当前任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      taskManager.setCurrentTask(taskHandle);
      const currentTask = taskManager.getCurrentTask();
      expect(currentTask).toBe(taskHandle);

      const taskInfo = taskManager.getTaskInfo(taskHandle);
      expect(taskInfo?.state).toBe(TaskState.RUNNING);
    });

    it('应该能够让出当前任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      taskManager.setCurrentTask(taskHandle);
      expect(taskManager.getCurrentTask()).toBe(taskHandle);

      taskManager.yieldCurrentTask();
      expect(taskManager.getCurrentTask()).toBe(null);

      const taskInfo = taskManager.getTaskInfo(taskHandle);
      expect(taskInfo?.state).toBe(TaskState.READY);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的任务句柄', () => {
      const invalidHandle = 999;

      expect(taskManager.deleteTask(invalidHandle)).toBe(false);
      expect(taskManager.suspendTask(invalidHandle)).toBe(false);
      expect(taskManager.resumeTask(invalidHandle)).toBe(false);
      expect(taskManager.blockTask(invalidHandle, 'delay')).toBe(false);
      expect(taskManager.unblockTask(invalidHandle)).toBe(false);
      expect(taskManager.setTaskPriority(invalidHandle, 10)).toBe(false);
      expect(taskManager.getTaskInfo(invalidHandle)).toBe(null);
    });

    it('应该处理重复的状态操作', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      // 挂起已经挂起的任务
      taskManager.suspendTask(taskHandle);
      expect(taskManager.suspendTask(taskHandle)).toBe(false);

      // 恢复已经就绪的任务
      taskManager.resumeTask(taskHandle);
      expect(taskManager.resumeTask(taskHandle)).toBe(false);
    });
  });

  describe('任务调度', () => {
    it('应该能够获取下一个任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        10,
        2048,
        undefined
      );

      const nextTask = taskManager.getNextTask();
      expect(nextTask).toBe(taskHandle);
    });

    it('应该优先调度高优先级任务', () => {
      // 创建不同优先级的任务
      const highPriorityTask = taskManager.createTask(
        'HighPriorityTask',
        function* () {
          yield;
        },
        20, // 高优先级
        2048,
        undefined
      );

      const lowPriorityTask = taskManager.createTask(
        'LowPriorityTask',
        function* () {
          yield;
        },
        5, // 低优先级
        2048,
        undefined
      );

      // 高优先级任务应该先被调度
      const nextTask = taskManager.getNextTask();
      expect(nextTask).toBe(highPriorityTask);
    });

    it('应该能够设置和获取当前任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        10,
        2048,
        undefined
      );

      expect(taskManager.getCurrentTask()).toBe(null);

      taskManager.setCurrentTask(taskHandle);
      expect(taskManager.getCurrentTask()).toBe(taskHandle);

      taskManager.setCurrentTask(null);
      expect(taskManager.getCurrentTask()).toBe(null);
    });

    it('应该能够切换当前任务', () => {
      const taskHandle = taskManager.createTask(
        'TestTask',
        function* () {
          yield;
        },
        10,
        2048,
        undefined
      );

      taskManager.setCurrentTask(taskHandle);
      expect(taskManager.getCurrentTask()).toBe(taskHandle);

      taskManager.yieldCurrentTask();
      expect(taskManager.getCurrentTask()).toBe(null);
    });
  });
});
