import { describe, it, expect, beforeEach } from 'vitest';
import { RTOS } from '../lib/rtos';
import { SchedulerConfig } from '../lib/types';

describe('RTOS', () => {
  let rtos: RTOS;
  let config: SchedulerConfig;

  beforeEach(() => {
    config = {
      maxTasks: 10,
      tickRate: 10,
      stackSize: 4096,
      idleTaskStackSize: 1024,
    };
    rtos = new RTOS(config);
  });

  describe('基本功能', () => {
    it('应该能够创建 RTOS 实例', () => {
      expect(rtos).toBeDefined();
      expect(rtos.getSystemStatus()).toBeDefined();
    });

    it('应该能够启动和停止系统', () => {
      const initialStatus = rtos.getSystemStatus();
      expect(initialStatus.isRunning).toBe(false);

      rtos.start();
      const runningStatus = rtos.getSystemStatus();
      expect(runningStatus.isRunning).toBe(true);

      rtos.stop();
      const stoppedStatus = rtos.getSystemStatus();
      expect(stoppedStatus.isRunning).toBe(false);
    });

    it('应该能够获取系统状态', () => {
      const status = rtos.getSystemStatus();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('tickCount');
      expect(status).toHaveProperty('currentTask');
      expect(status).toHaveProperty('readyTasks');
      expect(status).toHaveProperty('blockedTasks');
      expect(status).toHaveProperty('suspendedTasks');
      expect(status).toHaveProperty('totalTasks');
    });
  });

  describe('任务管理', () => {
    it('应该能够创建任务', () => {
      const taskHandle = rtos.createTask(
        () => {
          console.log('测试任务');
        },
        5,
        2048,
        undefined,
        'TestTask'
      );

      expect(taskHandle).toBeGreaterThan(0);
      expect(rtos.getSystemStatus().totalTasks).toBe(2); // 包括空闲任务
    });

    it('应该能够删除任务', () => {
      const taskHandle = rtos.createTask(
        () => {
          console.log('测试任务');
        },
        5,
        2048,
        undefined,
        'TestTask'
      );

      expect(rtos.getSystemStatus().totalTasks).toBe(2); // 包括空闲任务

      const result = rtos.deleteTask(taskHandle);
      expect(result).toBe(true);
      expect(rtos.getSystemStatus().totalTasks).toBe(1); // 只剩下空闲任务
    });

    it('应该能够挂起和恢复任务', () => {
      rtos.start();

      const taskHandle = rtos.createTask(
        () => {
          console.log('测试任务');
        },
        5,
        2048,
        undefined,
        'TestTask'
      );

      // 挂起任务
      const suspendResult = rtos.suspendTask(taskHandle);
      expect(suspendResult).toBe(true);
      expect(rtos.getSystemStatus().suspendedTasks).toBe(1);

      // 恢复任务
      const resumeResult = rtos.resumeTask(taskHandle);
      expect(resumeResult).toBe(true);
      expect(rtos.getSystemStatus().suspendedTasks).toBe(0);
    });

    it('应该能够设置任务优先级', () => {
      const taskHandle = rtos.createTask(
        () => {
          console.log('测试任务');
        },
        5,
        2048,
        undefined,
        'TestTask'
      );

      const result = rtos.setTaskPriority(taskHandle, 10);
      expect(result).toBe(true);

      const taskInfo = rtos.getTaskInfo(taskHandle);
      expect(taskInfo?.priority).toBe(10);
    });
  });

  describe('延时功能', () => {
    it('应该能够进行延时', () => {
      const delayResult = rtos.delay(10);
      expect(delayResult).toHaveProperty('delayTicks');
      expect(delayResult.delayTicks).toBe(0); // 没有当前任务时返回 0
    });

    it('应该能够进行毫秒延时', () => {
      const delayResult = rtos.delayMs(1000);
      expect(delayResult).toHaveProperty('delayTicks');
      expect(delayResult.delayTicks).toBe(0); // 没有当前任务时返回 0
    });

    it('应该能够让出 CPU', () => {
      expect(() => rtos.yield()).not.toThrow();
    });
  });

  describe('任务信息', () => {
    it('应该能够获取任务信息', () => {
      const taskHandle = rtos.createTask(
        () => {
          console.log('测试任务');
        },
        5,
        2048,
        undefined,
        'TestTask'
      );

      const taskInfo = rtos.getTaskInfo(taskHandle);
      expect(taskInfo).toBeDefined();
      expect(taskInfo?.name).toBe('TestTask');
      expect(taskInfo?.priority).toBe(5);
      expect(taskInfo?.stackSize).toBe(2048);
    });

    it('应该能够获取所有任务', () => {
      rtos.createTask(() => { console.log('任务1'); }, 5, 2048, undefined, 'Task1');
      rtos.createTask(() => { console.log('任务2'); }, 3, 2048, undefined, 'Task2');

      const allTasks = rtos.getAllTasks();
      expect(allTasks).toHaveLength(3); // 包括空闲任务
    });

    it('应该能够获取时钟节拍数', () => {
      const tickCount = rtos.getTickCount();
      expect(typeof tickCount).toBe('number');
      expect(tickCount).toBeGreaterThanOrEqual(0);
    });
  });

});
