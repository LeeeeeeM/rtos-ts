import { describe, it, expect, beforeEach } from 'vitest';
import { Scheduler } from '../lib/scheduler';
import { SchedulerConfig } from '../lib/types';

describe('Scheduler', () => {
  let scheduler: Scheduler;
  let config: SchedulerConfig;

  beforeEach(() => {
    config = {
      maxTasks: 10,
      tickRate: 10,
      stackSize: 4096,
      idleTaskStackSize: 1024,
    };
    scheduler = new Scheduler(config);
  });

  describe('基本功能', () => {
    it('应该能够创建调度器实例', () => {
      expect(scheduler).toBeDefined();
      expect(scheduler.getSystemStatus()).toBeDefined();
    });

    it('应该能够启动和停止调度器', () => {
      const initialStatus = scheduler.getSystemStatus();
      expect(initialStatus.isRunning).toBe(false);

      scheduler.start();
      const runningStatus = scheduler.getSystemStatus();
      expect(runningStatus.isRunning).toBe(true);

      scheduler.stop();
      const stoppedStatus = scheduler.getSystemStatus();
      expect(stoppedStatus.isRunning).toBe(false);
    });

    it('应该能够获取系统状态', () => {
      const status = scheduler.getSystemStatus();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('tickCount');
      expect(status).toHaveProperty('currentTask');
      expect(status).toHaveProperty('readyTasks');
      expect(status).toHaveProperty('blockedTasks');
      expect(status).toHaveProperty('suspendedTasks');
      expect(status).toHaveProperty('totalTasks');
    });
  });

  describe('任务调度', () => {
    it('应该能够创建任务', () => {
      const taskHandle = scheduler.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      expect(taskHandle).toBeGreaterThan(0);
      expect(scheduler.getSystemStatus().totalTasks).toBe(2); // 包括空闲任务
    });

    it('应该能够删除任务', () => {
      const taskHandle = scheduler.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      expect(scheduler.getSystemStatus().totalTasks).toBe(2); // 包括空闲任务

      const result = scheduler.deleteTask(taskHandle);
      expect(result).toBe(true);
      expect(scheduler.getSystemStatus().totalTasks).toBe(1); // 只剩下空闲任务
    });

    it('应该能够挂起和恢复任务', () => {
      scheduler.start();

      const taskHandle = scheduler.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      // 挂起任务
      const suspendResult = scheduler.suspendTask(taskHandle);
      expect(suspendResult).toBe(true);
      expect(scheduler.getSystemStatus().suspendedTasks).toBe(1);

      // 恢复任务
      const resumeResult = scheduler.resumeTask(taskHandle);
      expect(resumeResult).toBe(true);
      expect(scheduler.getSystemStatus().suspendedTasks).toBe(0);
    });

    it('应该能够设置任务优先级', () => {
      const taskHandle = scheduler.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      const result = scheduler.setTaskPriority(taskHandle, 10);
      expect(result).toBe(true);

      const taskInfo = scheduler.getTaskInfo(taskHandle);
      expect(taskInfo?.priority).toBe(10);
    });
  });

  describe('延时功能', () => {
    it('应该能够进行延时', () => {
      const delayResult = scheduler.delay(10);
      expect(delayResult).toHaveProperty('delayTicks');
      expect(delayResult.delayTicks).toBe(0); // 没有当前任务时返回 0
    });

    it('应该能够进行毫秒延时', () => {
      const delayResult = scheduler.delayMs(1000);
      expect(delayResult).toHaveProperty('delayTicks');
      expect(delayResult.delayTicks).toBe(0); // 没有当前任务时返回 0
    });

    it('应该能够让出 CPU', () => {
      expect(() => scheduler.yield()).not.toThrow();
    });
  });

  describe('任务信息', () => {
    it('应该能够获取任务信息', () => {
      const taskHandle = scheduler.createTask(
        'TestTask',
        function* () {
          yield;
        },
        5,
        2048,
        undefined
      );

      const taskInfo = scheduler.getTaskInfo(taskHandle);
      expect(taskInfo).toBeDefined();
      expect(taskInfo?.name).toBe('TestTask');
      expect(taskInfo?.priority).toBe(5);
      expect(taskInfo?.stackSize).toBe(2048);
    });

    it('应该能够获取所有任务', () => {
      scheduler.createTask('Task1', function* () { yield; }, 5, 2048, undefined);
      scheduler.createTask('Task2', function* () { yield; }, 3, 2048, undefined);

      const allTasks = scheduler.getAllTasks();
      expect(allTasks).toHaveLength(3); // 包括空闲任务
    });

    it('应该能够获取时钟节拍数', () => {
      const tickCount = scheduler.getTickCount();
      expect(typeof tickCount).toBe('number');
      expect(tickCount).toBeGreaterThanOrEqual(0);
    });
  });

});
