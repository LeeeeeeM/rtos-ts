import { Parser } from 'acorn';
import { simple as walk } from 'acorn-walk';

/**
 * RTOS 代码解析器和转换器
 * 负责将用户代码转换为可执行的异步代码
 */
export class RTOSParser {
  private yieldAllStatements: boolean = false;

  constructor(options?: { yieldAllStatements?: boolean }) {
    this.yieldAllStatements = options?.yieldAllStatements || false;
  }

  /**
   * 转换任务函数 - 将普通函数转换为 Generator
   */
  transformTaskFunction(taskFunction: Function): Function {
    try {
      // 检查输入参数
      if (!taskFunction || typeof taskFunction !== 'function') {
        throw new Error('Invalid task function: must be a function');
      }
      
    // 获取函数的字符串表示
    const funcString = taskFunction.toString();
      
      // 使用 acorn 检查是否包含 delay 调用
      const hasDelayCall = this.hasDelayCallInAST(funcString);
      
      if (!hasDelayCall) {
        // 如果没有 delay 调用，返回一个包装函数，直接调用原函数
        const functionBody = this.extractFunctionBody(funcString);
        return new Function('rtos', `
          return function*() {
            try {
              ${functionBody}
            } catch (error) {
              console.error('Generator 函数体执行出错:', error);
              throw error;
            }
          };
        `);
      }

      // 检查：只有当函数中有使用传入参数的 delay 调用时，才进行转换
      if (!this.hasValidDelayCalls(funcString)) {
        console.warn('函数中没有使用传入参数的 delay 调用，保持原函数不变');
        return taskFunction;
      }
    
    // 解析并转换函数为 Generator
    const transformedCode = this.parseAndTransformToGenerator(funcString);
    
    // 提取函数体，去掉外层的包装
    const functionBody = this.extractFunctionBody(transformedCode);
      
      // 获取实际的参数名
      const actualParamName = this.getActualParameterName(transformedCode);
      
      // 将函数体中的实际参数名替换为 rtos
      const normalizedFunctionBody = functionBody.replace(new RegExp(`\\b${actualParamName}\\b`, 'g'), 'rtos');
    
    // 直接返回转换后的 Generator 函数
      return new Function('rtos', `
      try {
        return function*() {
          try {
            ${normalizedFunctionBody}
          } catch (error) {
            console.error('Generator 函数体执行出错:', error);
            throw error;
          }
        };
      } catch (error) {
        console.error('Generator 函数创建出错:', error);
        throw error;
      }
    `);
      
    } catch (error) {
      console.error('转换任务函数时出错:', error);
      throw error;
    }
  }

  /**
   * 使用 acorn 检查是否包含 delay 调用
   */
  private hasDelayCallInAST(funcString: string): boolean {
    try {
      const ast = Parser.parse(funcString, {
        ecmaVersion: 2022,
        sourceType: 'module'
      });

      let hasDelay = false;
      const self = this;
      walk(ast, {
        CallExpression(node: any) {
          if (self.isDelayCall(node)) {
            hasDelay = true;
          }
        }
      });

      return hasDelay;
    } catch (error) {
      // 如果解析失败，回退到正则表达式
      return /\.\w*delay\(/.test(funcString);
    }
  }

  /**
   * 检查是否是 delay 调用
   */
  private isDelayCall(node: any): boolean {
    // 检查 delay 方法调用（不限定对象名）
    if (node.callee.type === 'MemberExpression') {
      return node.callee.property.name === 'delay';
    }
    
    // 检查直接的 delay 调用
    return node.callee.type === 'Identifier' && node.callee.name === 'delay';
  }

  /**
   * 检查是否有使用参数中变量的 delay 调用
   */
  private hasValidDelayCalls(funcString: string): boolean {
    try {
      const ast = Parser.parse(funcString, {
        ecmaVersion: 2022,
        sourceType: 'module'
      });

      // 获取函数参数
      const parameters = this.getFunctionParameters(ast);
      
      // 检查 delay 调用是否使用参数中的变量
      return this.checkValidDelayCalls(ast, parameters);
    } catch (error) {
      // 如果检查失败，默认返回 true（进行转换）
      return true;
    }
  }

  /**
   * 获取函数的参数列表
   */
  private getFunctionParameters(ast: any): string[] {
    const parameters: string[] = [];
    
    walk(ast, {
      FunctionExpression(node: any) {
        node.params.forEach((param: any) => {
          if (param.type === 'Identifier') {
            parameters.push(param.name);
          }
        });
      },
      ArrowFunctionExpression(node: any) {
        node.params.forEach((param: any) => {
          if (param.type === 'Identifier') {
            parameters.push(param.name);
          }
        });
      }
    });
    
    return parameters;
  }

  /**
   * 检查是否有使用参数中变量的 delay 调用
   */
  private checkValidDelayCalls(ast: any, parameters: string[]): boolean {
    let hasValidCall = true;
    const self = this;
    
    walk(ast, {
      CallExpression(node: any) {
        if (self.isDelayCall(node)) {
          // 检查 delay 调用的对象是否是参数中的变量
          if (node.callee.type === 'MemberExpression') {
            const objectName = node.callee.object.name;
            if (!parameters.includes(objectName)) {
              hasValidCall = false;
            }
          }
        }
      }
    });
    
    return hasValidCall;
  }

  /**
   * 提取函数体，去掉外层的包装
   */
  private extractFunctionBody(transformedCode: string): string {
    try {
      // 使用 acorn 解析代码
      const ast = Parser.parse(transformedCode, {
        ecmaVersion: 2022,
        sourceType: 'module'
      });
      
      // 查找第一个函数节点
      let functionBody: string | undefined;
      const self = this;
      
      walk(ast, {
        FunctionExpression(node: any) {
          if (node.body.type === 'BlockStatement') {
            // 获取函数体的源代码
            functionBody = self.getNodeSource(transformedCode, node.body);
            // 去掉最外层的花括号
            if (functionBody && functionBody.startsWith('{') && functionBody.endsWith('}')) {
              functionBody = functionBody.slice(1, -1).trim();
            }
          }
        },
        ArrowFunctionExpression(node: any) {
          if (node.body.type === 'BlockStatement') {
            // 获取函数体的源代码
            functionBody = self.getNodeSource(transformedCode, node.body);
            // 去掉最外层的花括号
            if (functionBody && functionBody.startsWith('{') && functionBody.endsWith('}')) {
              functionBody = functionBody.slice(1, -1).trim();
            }
          }
        }
      });
      
      return functionBody || transformedCode;
    } catch (error) {
      // 如果 acorn 解析失败，回退到字符串操作
      const startIndex = transformedCode.indexOf('{');
      if (startIndex === -1) {
        return transformedCode;
      }
      
      // 找到匹配的结束括号
      let braceCount = 0;
      let endIndex = -1;
      
      for (let i = startIndex; i < transformedCode.length; i++) {
        if (transformedCode[i] === '{') {
          braceCount++;
        } else if (transformedCode[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
      }
      
      if (endIndex === -1) {
        return transformedCode;
      }
      
      // 提取函数体内容
      return transformedCode.substring(startIndex + 1, endIndex).trim();
    }
  }

  /**
   * 获取节点的源代码
   */
  private getNodeSource(code: string, node: any): string {
    return code.slice(node.start, node.end);
  }

  /**
   * 获取实际的参数名
   */
  private getActualParameterName(code: string): string {
    try {
      const ast = Parser.parse(code, {
        ecmaVersion: 2022,
        sourceType: 'module'
      });

      let paramName = 'rtos'; // 默认参数名
      
      walk(ast, {
        FunctionExpression(node: any) {
          if (node.params.length > 0 && node.params[0].type === 'Identifier') {
            paramName = node.params[0].name;
          }
        },
        ArrowFunctionExpression(node: any) {
          if (node.params.length > 0 && node.params[0].type === 'Identifier') {
            paramName = node.params[0].name;
          }
        }
      });
      
      return paramName;
    } catch (error) {
      // 如果解析失败，尝试从字符串中提取参数名
      const match = code.match(/\((\w+)\)\s*=>/);
      return match?.[1] || 'rtos';
    }
  }

  /**
   * 解析并转换为 Generator 函数
   */
  parseAndTransformToGenerator(code: string): string {
    try {
      // 使用 acorn 解析代码
      const ast = Parser.parse(code, {
        ecmaVersion: 2022,
        sourceType: 'module'
      });

      let result = code;
      const self = this;
      const replacements: Array<{from: string, to: string}> = [];
      
      if (this.yieldAllStatements) {
        // 将所有语句转换为 yield
        walk(ast, {
          ExpressionStatement(node: any) {
            // 跳过已经是 yield 的语句
            if (node.expression.type === 'YieldExpression') {
              return;
            }
            
            // 跳过函数定义本身
            if (node.expression.type === 'ArrowFunctionExpression' || 
                node.expression.type === 'FunctionExpression') {
              return;
            }
            
            const statement = self.getNodeSource(code, node);
            const yieldStatement = `yield ${statement}`;
            replacements.push({ from: statement, to: yieldStatement });
          }
        });
      } else {
        // 只将 delay 调用转换为 yield（原有行为）
        walk(ast, {
          CallExpression(node: any) {
            if (self.isDelayCall(node)) {
              const delayCall = self.getNodeSource(code, node);
              const yieldCall = `yield ${delayCall}`;
              replacements.push({ from: delayCall, to: yieldCall });
            }
          }
        });
      }
      
      // 从后往前替换，避免位置偏移问题
      replacements.reverse().forEach(({ from, to }) => {
        result = result.replace(from, to);
      });
      
      return result;
    } catch (error) {
      console.error('解析代码时出错:', error);
      throw error;
    }
  }
}
