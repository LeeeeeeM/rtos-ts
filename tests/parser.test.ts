import { describe, it, expect, beforeEach } from 'vitest';
import { RTOSParser } from '../lib/parser';

describe('RTOSParser', () => {
  let parser: RTOSParser;

  beforeEach(() => {
    parser = new RTOSParser();
  });

  describe('基本功能', () => {
    it('应该能够创建解析器实例', () => {
      expect(parser).toBeDefined();
    });

    it('应该能够转换简单的任务函数', () => {
      const taskFunction = () => {
        console.log('Hello World');
      };

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      expect(transformedFunction).toBeDefined();
      expect(typeof transformedFunction).toBe('function');
    });

    it('应该能够转换包含延时的任务函数', () => {
      const taskFunction = () => {
        console.log('开始');
        rtos.delay(10);
        console.log('结束');
      };

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      expect(transformedFunction).toBeDefined();
      expect(typeof transformedFunction).toBe('function');
    });

    it('应该能够转换包含循环的任务函数', () => {
      const taskFunction = () => {
        let count = 0;
        while (count < 5) {
          console.log(`计数: ${count}`);
          rtos.delay(10);
          count++;
        }
      };

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      expect(transformedFunction).toBeDefined();
      expect(typeof transformedFunction).toBe('function');
    });
  });

  describe('Generator 函数生成', () => {
    it('应该生成有效的 Generator 函数', () => {
      const taskFunction = () => {
        console.log('测试');
        rtos.delay(10);
      };

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction({}, console, () => {});
      
      expect(generatorFunction).toBeDefined();
      expect(typeof generatorFunction).toBe('function');
      
      // 测试 Generator 函数是否可迭代
      const generator = generatorFunction();
      expect(generator).toBeDefined();
      expect(typeof generator.next).toBe('function');
    });

    it('应该正确处理 yield 语句', () => {
      const taskFunction = () => {
        rtos.delay(10);
      };

      const mockRtos = { delay: () => ({ delayTicks: 10 }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos, console, () => {});
      const generator = generatorFunction();

      const result = generator.next();
      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.delayTicks).toBe(10);
    });

    it('应该能够处理多个 yield 语句', () => {
      const taskFunction = () => {
        rtos.delay(5);
        console.log('中间');
        rtos.delay(10);
        console.log('结束');
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos, console, () => {});
      const generator = generatorFunction();

      // 第一个 yield
      const result1 = generator.next();
      expect(result1.value.delayTicks).toBe(5);

      // 第二个 yield
      const result2 = generator.next();
      expect(result2.value.delayTicks).toBe(10);

      // 完成
      const result3 = generator.next();
      expect(result3.done).toBe(true);
    });
  });

  describe('复杂任务函数', () => {
    it('应该能够处理条件语句', () => {
      const taskFunction = () => {
        const condition = true;
        if (condition) {
          rtos.delay(10);
        } else {
          rtos.delay(5);
        }
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos, console, () => {});
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.value.delayTicks).toBe(10);
    });
  });

  describe('错误处理', () => {
    it('应该能够处理无效的函数', () => {
      expect(() => {
        parser.transformTaskFunction(null as any);
      }).toThrow();
    });

    it('应该能够处理空函数', () => {
      const emptyFunction = () => {};
      const transformedFunction = parser.transformTaskFunction(emptyFunction);
      const generatorFunction = transformedFunction({}, console, () => {});
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.done).toBe(true);
    });

    it('应该能够处理没有延时的函数', () => {
      const noDelayFunction = () => {
        console.log('没有延时');
        const x = 1 + 1;
        console.log(x);
      };

      const transformedFunction = parser.transformTaskFunction(noDelayFunction);
      const generatorFunction = transformedFunction({}, console, () => {});
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.done).toBe(true);
    });
  });

  describe('参数传递', () => {
    it('应该能够传递 rtos 参数', () => {
      const taskFunction = () => {
        rtos.delay(10);
      };

      const mockRtos = { delay: () => ({ delayTicks: 10 }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos, console, () => {});
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.value.delayTicks).toBe(10);
    });
  });
});
