import React, { useState } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Typography, Alert, Input } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { RTOSParser } from '../../../lib/parser';
import styles from './index.module.css';

const { TextArea } = Input;

const CodeTransformPage: React.FC = () => {
  const [transformedCode, setTransformedCode] = useState('');
  const [yieldAllStatements, setYieldAllStatements] = useState(false);
  
  // 任务代码
  const [taskCode, setTaskCode] = useState(`// 创建多个任务示例 - 展示交替执行效果
rtos.createTask((rtos) => {
    console.log("任务A开始");
    console.log("任务A执行步骤1");
    rtos.delay(20);
    console.log("任务A执行步骤2");
    rtos.delay(30);
    console.log("任务A完成");
}, 10, 2048, undefined, 'TaskA');

rtos.createTask((rtos) => {
    console.log("任务B开始");
    console.log("任务B执行步骤1");
    rtos.delay(25);
    console.log("任务B执行步骤2");
    rtos.delay(35);
    console.log("任务B完成");
}, 10, 2048, undefined, 'TaskB');

rtos.createTask((rtos) => {
    console.log("任务C开始");
    console.log("任务C执行步骤1");
    rtos.delay(15);
    console.log("任务C执行步骤2");
    rtos.delay(40);
    console.log("任务C完成");
}, 10, 2048, undefined, 'TaskC');`);


  // 转换代码
  const transformCode = () => {
    try {
      console.log("开始转换代码...");
      console.log("转换模式:", yieldAllStatements ? "所有语句转 yield" : "仅 delay 转 yield");
      
      // 使用 RTOS 内部的解析器
      const parser = new RTOSParser({ yieldAllStatements });
      
      // 提取 createTask 内部的函数代码并转换
      const taskFunctionRegex = /rtos\.createTask\(\(([^)]+)\)\s*=>\s*\{([\s\S]*?)\}/g;
      let result = taskCode;
      let match;
      
      while ((match = taskFunctionRegex.exec(taskCode)) !== null) {
        const fullMatch = match[0];
        const params = match[1];
        const functionBody = match[2];
        
        // 转换函数体
        const transformedBody = parser.parseAndTransformToGenerator(`(${params}) => {${functionBody}}`);
        
        // 将箭头函数转换为 Generator 函数
        const generatorFunction = transformedBody.replace(/^\(([^)]+)\)\s*=>\s*\{/, 'function* ($1) {');
        
        // 使用转换后的 Generator 函数
        const newFullMatch = `rtos.createTask(${generatorFunction}`;
        
        result = result.replace(fullMatch, newFullMatch);
      }
      
      console.log("代码转换成功");
      console.log("转换结果:", result);
      
      setTransformedCode(result);
    } catch (error) {
      console.error("代码转换失败:", error);
      console.error("错误详情:", error instanceof Error ? error.message : String(error));
      setTransformedCode("");
    }
  };



  return (
    <div className={styles.container}>
      <Typography.Title level={2}>代码转换演示</Typography.Title>
      
      <Alert
        message="代码转换演示"
        description="这个页面专门用于展示代码转换功能。你可以选择转换模式，查看转换结果。如需执行任务，请前往'任务执行'页面。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="转换模式" 
              value={yieldAllStatements ? '所有语句转 yield' : '仅 delay 转 yield'} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="转换状态" 
              value={transformedCode ? '已转换' : '未转换'} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="代码长度" 
              value={taskCode.length} 
              suffix="字符"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="转换后长度" 
              value={transformedCode.length} 
              suffix="字符"
            />
          </Card>
        </Col>
      </Row>

      <Card title="代码转换" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>转换模式：</Typography.Text>
            <Button
              type={yieldAllStatements ? "primary" : "default"}
              size="small"
              onClick={() => setYieldAllStatements(true)}
              style={{ marginLeft: 8 }}
            >
              所有语句转 yield
            </Button>
            <Button
              type={!yieldAllStatements ? "primary" : "default"}
              size="small"
              onClick={() => setYieldAllStatements(false)}
              style={{ marginLeft: 8 }}
            >
              仅 delay 转 yield
            </Button>
          </div>
          
          <div>
            <Typography.Text strong>原始代码：</Typography.Text>
            <TextArea
              value={taskCode}
              onChange={(e) => setTaskCode(e.target.value)}
              placeholder="输入包含 rtos.delay() 的任务代码..."
              rows={6}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <Button 
              type="primary"
              icon={<CodeOutlined />}
              onClick={transformCode}
            >
              转换代码
            </Button>
          </div>
          
          {transformedCode && (
            <div>
              <Typography.Text strong>转换后的代码：</Typography.Text>
              <TextArea
                value={transformedCode}
                readOnly
                rows={6}
                style={{ marginTop: 8, backgroundColor: '#f5f5f5' }}
              />
            </div>
          )}
        </Space>
      </Card>


    </div>
  );
};

export default CodeTransformPage;
