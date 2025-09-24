import * as ts from 'typescript';

/**
 * RTOS 代码解析器和转换器
 * 负责将用户代码转换为可执行的异步代码
 */
export class RTOSParser {
  private sourceFile: ts.SourceFile | null = null;

  constructor() {
  }


  /**
   * 转换任务函数 - 将普通函数转换为 Generator
   */
  transformTaskFunction(taskFunction: Function): Function {
    try {
      // 获取函数的字符串表示
      const funcString = taskFunction.toString();
      
      // 检查是否包含 delay 调用
      if (!funcString.includes('rtos.delay') && !funcString.includes('delay(')) {
        // 如果没有 delay 调用，直接返回原函数
        return taskFunction;
      }
      
      // 解析并转换函数为 Generator
      const transformedCode = this.parseAndTransformToGenerator(funcString);
      
      // 提取函数体，去掉外层的包装
      const functionBody = this.extractFunctionBody(transformedCode);
      
      // 直接返回转换后的 Generator 函数
      return new Function('rtos', 'console', 'log', `
        try {
          return function*() {
            try {
              ${functionBody}
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
      // 如果转换失败，返回原函数
      return taskFunction;
    }
  }

  /**
   * 提取函数体，去掉外层的包装
   */
  private extractFunctionBody(transformedCode: string): string {
    // 查找函数体的开始和结束位置
    const startIndex = transformedCode.indexOf('{');
    const endIndex = transformedCode.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      return transformedCode;
    }
    
    // 提取函数体内容
    return transformedCode.substring(startIndex + 1, endIndex).trim();
  }

  /**
   * 解析并转换为 Generator 函数
   */
  parseAndTransformToGenerator(code: string): string {
    // 创建 TypeScript 源文件
    this.sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );

    // 转换 AST
    const result = ts.transform(this.sourceFile, [
      this.createGeneratorTransformer()
    ]);

    // 生成转换后的代码
    const printer = ts.createPrinter();
    const transformedSourceFile = result.transformed[0];
    
    if (!transformedSourceFile) {
      throw new Error('转换失败');
    }
    
    return printer.printFile(transformedSourceFile);
  }

  /**
   * 创建 Generator 转换器
   */
  private createGeneratorTransformer(): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
      return (sourceFile: ts.SourceFile) => {
        const visit = (node: ts.Node): ts.Node => {
          // 处理函数声明
          if (ts.isFunctionDeclaration(node)) {
            return this.transformFunctionToGenerator(node, context);
          }
          
          // 处理箭头函数
          if (ts.isArrowFunction(node)) {
            return this.transformArrowFunctionToGenerator(node, context);
          }
          
          // 处理函数表达式
          if (ts.isFunctionExpression(node)) {
            return this.transformFunctionExpressionToGenerator(node, context);
          }

          // 处理 createTask 调用
          if (ts.isCallExpression(node)) {
            return this.transformCreateTaskCall(node, context);
          }

          return ts.visitEachChild(node, visit, context);
        };

        return ts.visitNode(sourceFile, visit) as ts.SourceFile;
      };
    };
  }


  /**
   * 转换函数声明为 Generator
   */
  private transformFunctionToGenerator(
    node: ts.FunctionDeclaration, 
    context: ts.TransformationContext
  ): ts.FunctionDeclaration {
    const visit = (child: ts.Node): ts.Node => {
      if (ts.isCallExpression(child)) {
        return this.transformDelayCall(child);
      }
      return ts.visitEachChild(child, visit, context);
    };

    const transformedBody = node.body ? ts.visitNode(node.body, visit) as ts.Block : undefined;
    
    // 如果函数体包含 delay 调用，添加 Generator 关键字
    const hasDelayCall = node.body ? this.hasDelayCall(node.body) : false;
    const asteriskToken = hasDelayCall 
      ? ts.factory.createToken(ts.SyntaxKind.AsteriskToken)
      : node.asteriskToken;

    return ts.factory.updateFunctionDeclaration(
      node,
      node.modifiers,
      asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      node.type,
      transformedBody
    );
  }

  /**
   * 转换箭头函数为 Generator 函数表达式
   */
  private transformArrowFunctionToGenerator(
    node: ts.ArrowFunction,
    context: ts.TransformationContext
  ): ts.FunctionExpression {
    const visit = (child: ts.Node): ts.Node => {
      if (ts.isCallExpression(child)) {
        return this.transformDelayCall(child);
      }
      return ts.visitEachChild(child, visit, context);
    };

    const transformedBody = ts.visitNode(node.body, visit) as ts.ConciseBody;
    
    // 如果包含 delay 调用，转换为 Generator 函数表达式
    const hasDelayCall = this.hasDelayCall(node.body);
    const asteriskToken = hasDelayCall 
      ? ts.factory.createToken(ts.SyntaxKind.AsteriskToken)
      : undefined;

    // 将箭头函数转换为函数表达式
    return ts.factory.createFunctionExpression(
      node.modifiers,
      asteriskToken,
      undefined, // name
      node.typeParameters,
      node.parameters,
      node.type,
      transformedBody as ts.Block
    );
  }

  /**
   * 转换函数表达式为 Generator
   */
  private transformFunctionExpressionToGenerator(
    node: ts.FunctionExpression,
    context: ts.TransformationContext
  ): ts.FunctionExpression {
    const visit = (child: ts.Node): ts.Node => {
      if (ts.isCallExpression(child)) {
        return this.transformDelayCall(child);
      }
      return ts.visitEachChild(child, visit, context);
    };

    const transformedBody = node.body ? ts.visitNode(node.body, visit) as ts.Block : undefined;
    
    // 如果包含 delay 调用，添加 Generator 关键字
    const hasDelayCall = node.body ? this.hasDelayCall(node.body) : false;
    const asteriskToken = hasDelayCall 
      ? ts.factory.createToken(ts.SyntaxKind.AsteriskToken)
      : node.asteriskToken;

    return ts.factory.updateFunctionExpression(
      node,
      node.modifiers,
      asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      node.type,
      transformedBody!
    );
  }




  /**
   * 转换 createTask 调用
   */
  private transformCreateTaskCall(
    node: ts.CallExpression,
    context: ts.TransformationContext
  ): ts.CallExpression {
    // 检查是否是 rtos.createTask 调用
    if (ts.isPropertyAccessExpression(node.expression)) {
      const object = node.expression.expression;
      const property = node.expression.name;
      
      if (ts.isIdentifier(object) && object.text === 'rtos' && 
          ts.isIdentifier(property) && property.text === 'createTask') {
        
        // 转换参数中的函数
        const transformedArgs = node.arguments.map(arg => {
          if (ts.isArrowFunction(arg)) {
            return this.transformArrowFunctionToGenerator(arg, context);
          } else if (ts.isFunctionExpression(arg)) {
            return this.transformFunctionExpressionToGenerator(arg, context);
          }
          return arg;
        });

        return ts.factory.updateCallExpression(
          node,
          node.expression,
          node.typeArguments,
          transformedArgs
        );
      }
    }

    return node;
  }

  /**
   * 转换 delay 调用为 yield
   */
  private transformDelayCall(
    node: ts.CallExpression
  ): ts.Node {
    // 检查是否是 rtos.delay 调用
    if (ts.isPropertyAccessExpression(node.expression)) {
      const object = node.expression.expression;
      const property = node.expression.name;
      
      if (ts.isIdentifier(object) && object.text === 'rtos' && 
          ts.isIdentifier(property) && property.text === 'delay') {
        // 转换为 yield rtos.delay
        return ts.factory.createYieldExpression(
          undefined,
          node
        );
      }
    }
    
    // 检查是否是 delay 调用
    if (ts.isIdentifier(node.expression) && node.expression.text === 'delay') {
      // 转换为 yield rtos.delay
      const rtosDelayCall = ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('rtos'),
          ts.factory.createIdentifier('delay')
        ),
        undefined,
        node.arguments
      );

      return ts.factory.createYieldExpression(undefined, rtosDelayCall);
    }

    return node;
  }

  /**
   * 检查节点是否包含 delay 调用
   */
  private hasDelayCall(node: ts.Node): boolean {
    let hasDelay = false;
    
    const visit = (child: ts.Node): void => {
      if (ts.isCallExpression(child)) {
        // 检查 rtos.delay 调用
        if (ts.isPropertyAccessExpression(child.expression)) {
          const object = child.expression.expression;
          const property = child.expression.name;
          
          if (ts.isIdentifier(object) && object.text === 'rtos' &&
              ts.isIdentifier(property) && property.text === 'delay') {
            hasDelay = true;
          }
        }
        
        // 检查直接的 delay 调用
        if (ts.isIdentifier(child.expression) && child.expression.text === 'delay') {
          hasDelay = true;
        }
      }
      ts.forEachChild(child, visit);
    };

    ts.forEachChild(node, visit);
    return hasDelay;
  }

  /**
   * 执行转换后的代码
   */
  executeTransformedCode(transformedCode: string, rtos: any): any {
    try {
      // 直接执行转换后的代码，不包装在 Generator 中
      // 因为转换后的代码已经包含了 Generator 函数
      const func = new Function('rtos', 'console', transformedCode);
      return func(rtos, console);
    } catch (error) {
      console.error('执行转换后的代码时出错:', error);
      throw error;
    }
  }
}
