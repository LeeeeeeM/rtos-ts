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
      expect(parser).toBeInstanceOf(RTOSParser);
    });

    it('应该能够转换简单的任务函数', () => {
      const taskFunction = (rtos) => {
        console.log('Hello World');
      };

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      expect(transformedFunction).toBeDefined();
      expect(typeof transformedFunction).toBe('function');
    });

    it('应该能够转换包含延时的任务函数', () => {
      const taskFunction = (rtos) => {
        console.log('开始');
        rtos.delay(100);
        console.log('结束');
      };

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      expect(transformedFunction).toBeDefined();
      expect(typeof transformedFunction).toBe('function');
    });

    it('应该能够转换包含循环的任务函数', () => {
      const taskFunction = (rtos) => {
        for (let i = 0; i < 3; i++) {
          console.log(`循环 ${i}`);
          rtos.delay(50);
        }
      };

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      expect(transformedFunction).toBeDefined();
      expect(typeof transformedFunction).toBe('function');
    });
  });

  describe('Generator 函数生成', () => {
    it('应该生成有效的 Generator 函数', () => {
      const taskFunction = (rtos) => {
        console.log('测试');
        rtos.delay(10);
      };

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction({});
      
      expect(generatorFunction).toBeDefined();
      expect(typeof generatorFunction).toBe('function');
      
      // 测试 Generator 函数是否可迭代
      const generator = generatorFunction();
      expect(generator).toBeDefined();
      expect(typeof generator.next).toBe('function');
    });

    it('应该正确处理 yield 语句', () => {
      const taskFunction = (rtos) => {
        rtos.delay(10);
      };

      const mockRtos = { delay: () => ({ delayTicks: 10 }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      const result = generator.next();
      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.delayTicks).toBe(10);
    });

    it('应该能够处理多个 yield 语句', () => {
      const taskFunction = (rtos) => {
        rtos.delay(5);
        console.log('中间');
        rtos.delay(10);
        console.log('结束');
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
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
      const taskFunction = (rtos) => {
        const condition = true;
        if (condition) {
          rtos.delay(10);
        } else {
          rtos.delay(5);
        }
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.value.delayTicks).toBe(10);
    });

    it('应该能够处理变量赋值', () => {
      const taskFunction = (rtos) => {
        const delayTime = 20;
        rtos.delay(delayTime);
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.value.delayTicks).toBe(20);
    });

    it('应该能够处理 try-catch 语句', () => {
      const taskFunction = (rtos) => {
        try {
          rtos.delay(15);
        } catch (error) {
          console.log('错误');
        }
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.value.delayTicks).toBe(15);
    });
  });

  describe('错误处理', () => {
    it('应该能够处理无效的函数', () => {
      expect(() => {
        parser.transformTaskFunction(null as any);
      }).toThrow('Invalid task function: must be a function');
    });

    it('应该能够处理空函数', () => {
      const taskFunction = (rtos) => {};

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      expect(transformedFunction).toBeDefined();
      expect(typeof transformedFunction).toBe('function');
    });

    it('应该能够处理没有延时的函数', () => {
      const taskFunction = (rtos) => {
        console.log('没有延时');
        return 42;
      };

      const transformedFunction = parser.transformTaskFunction(taskFunction);
      expect(transformedFunction).toBeDefined();
      expect(typeof transformedFunction).toBe('function');
    });

    it('应该能够处理语法错误的函数', () => {
      // 创建一个有语法错误的函数字符串
      const invalidCode = `
        console.log('开始');
        rtos.delay(10;
        console.log('结束');
      `;

      expect(() => {
        parser.parseAndTransformToGenerator(invalidCode);
      }).toThrow();
    });
  });

  describe('参数传递', () => {
    it('应该能够传递 rtos 参数', () => {
      const taskFunction = (rtos) => {
        rtos.delay(10);
      };

      const mockRtos = { delay: () => ({ delayTicks: 10 }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.value.delayTicks).toBe(10);
    });

    it('应该能够处理不同参数名的函数', () => {
      const taskFunction = (myRtos) => {
        myRtos.delay(25);
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.value.delayTicks).toBe(25);
    });
  });

  describe('边界情况', () => {
    it('应该能够处理只有 delay 调用的函数', () => {
      const taskFunction = (rtos) => {
        rtos.delay(100);
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      const result = generator.next();
      expect(result.value.delayTicks).toBe(100);
      expect(result.done).toBe(false);

      const finalResult = generator.next();
      expect(finalResult.done).toBe(true);
    });

    it('应该能够处理延迟调用在条件分支中的情况', () => {
      const taskFunction = (rtos) => {
        const flag = true; // 固定为 true，确保条件分支被执行
        if (flag) {
          rtos.delay(30);
        }
        rtos.delay(20);
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      // 第一个 yield（条件分支中的 rtos.delay(30)）
      const result1 = generator.next();
      expect(result1.value.delayTicks).toBe(30);

      // 第二个 yield（最后的 rtos.delay(20)）
      const result2 = generator.next();
      expect(result2.value.delayTicks).toBe(20);
    });

    it('应该能够处理延迟调用在循环中的情况', () => {
      const taskFunction = (rtos) => {
        for (let i = 0; i < 2; i++) {
          rtos.delay(10);
        }
      };

      const mockRtos = { delay: (ticks: number) => ({ delayTicks: ticks }) };
      const transformedFunction = parser.transformTaskFunction(taskFunction);
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      // 第一个 yield
      const result1 = generator.next();
      expect(result1.value.delayTicks).toBe(10);

      // 第二个 yield
      const result2 = generator.next();
      expect(result2.value.delayTicks).toBe(10);

      // 完成
      const result3 = generator.next();
      expect(result3.done).toBe(true);
    });
  });

  describe('parseAndTransformToGenerator 方法', () => {
    it('应该能够解析和转换代码字符串', () => {
      const code = '(rtos) => { console.log("开始"); rtos.delay(50); console.log("结束"); }';

      const result = parser.parseAndTransformToGenerator(code);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('yield');
    });

    it('应该能够处理箭头函数', () => {
      const code = '(rtos) => { rtos.delay(100); }';

      const result = parser.parseAndTransformToGenerator(code);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('yield');
    });

    it('应该能够处理多个 delay 调用', () => {
      const code = '(rtos) => { rtos.delay(10); console.log("中间"); rtos.delay(20); }';

      const result = parser.parseAndTransformToGenerator(code);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // 应该有两个 yield
      const yieldCount = (result.match(/yield/g) || []).length;
      expect(yieldCount).toBe(2);
    });

    it('应该能够处理没有 delay 的代码', () => {
      const code = '(rtos) => { console.log("没有delay"); }';

      const result = parser.parseAndTransformToGenerator(code);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).not.toContain('yield');
    });
  });

  describe('yieldAllStatements 功能', () => {
    it('应该能够将所有语句转换为 yield', () => {
      const parserWithYieldAll = new RTOSParser({ yieldAllStatements: true });
      const code = '(rtos) => { console.log("start 2"); console.log("start 3"); rtos.delay(100); console.log("start 4"); }';

      const result = parserWithYieldAll.parseAndTransformToGenerator(code);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      
      // 应该包含多个 yield
      const yieldCount = (result.match(/yield/g) || []).length;
      expect(yieldCount).toBeGreaterThan(1);
      
      // 检查每个语句都被转换为 yield
      expect(result).toContain('yield console.log("start 2")');
      expect(result).toContain('yield console.log("start 3")');
      expect(result).toContain('yield rtos.delay(100)');
      expect(result).toContain('yield console.log("start 4")');
    });

    it('应该能够正确处理 yieldAllStatements 的任务函数', () => {
      const parserWithYieldAll = new RTOSParser({ yieldAllStatements: true });
      const taskFunction = (rtos) => {
        console.log("start 2");
        console.log("start 3");
        rtos.delay(100);
        console.log("start 4");
      };

      const transformedFunction = parserWithYieldAll.transformTaskFunction(taskFunction);
      const mockRtos = { delay: () => ({ delayTicks: 100 }) };
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      // 测试所有语句都被 yield
      const result1 = generator.next();
      expect(result1.done).toBe(false); // 第一个 yield

      const result2 = generator.next();
      expect(result2.done).toBe(false); // 第二个 yield

      const result3 = generator.next();
      expect(result3.done).toBe(false); // 第三个 yield (delay)

      const result4 = generator.next();
      expect(result4.done).toBe(false); // 第四个 yield

      const result5 = generator.next();
      expect(result5.done).toBe(true); // 完成
    });

    it('应该能够处理复杂的 yieldAllStatements 场景', () => {
      const parserWithYieldAll = new RTOSParser({ yieldAllStatements: true });
      const taskFunction = (rtos) => {
        const x = 10;
        console.log("x =", x);
        rtos.delay(50);
        const y = x * 2;
        console.log("y =", y);
      };

      const transformedFunction = parserWithYieldAll.transformTaskFunction(taskFunction);
      const mockRtos = { delay: () => ({ delayTicks: 50 }) };
      const generatorFunction = transformedFunction(mockRtos);
      const generator = generatorFunction();

      // 测试所有语句都被 yield
      let result = generator.next();
      let yieldCount = 0;
      while (!result.done) {
        expect(result.done).toBe(false);
        yieldCount++;
        result = generator.next();
      }
      expect(result.done).toBe(true);
      expect(yieldCount).toBeGreaterThan(0); // 应该有多个 yield
    });
  });
});