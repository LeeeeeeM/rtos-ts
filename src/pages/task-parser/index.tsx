import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Typography, Alert, Input } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, CodeOutlined } from '@ant-design/icons';
import { RTOS } from '../../../lib/rtos';
import { SchedulerConfig } from '../../../lib/types';
import { RTOSParser } from '../../../lib/parser';
import { useLog } from '../../contexts/LogContext';
import styles from './index.module.css';

const { TextArea } = Input;

const TaskParserExample: React.FC = () => {
  const { startCapture, stopCapture } = useLog();
  
  // 创建独立的 RTOS 实例
  const [rtos] = useState(() => {
    const config: SchedulerConfig = {
      maxTasks: 10,
      tickRate: 10, // 每秒10个时钟节拍
      stackSize: 4096,
      idleTaskStackSize: 1024,
    };
    return new RTOS(config);
  });
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState(rtos.getSystemStatus());
  const [originalCode, setOriginalCode] = useState(`
    rtos.createTask(() => {
    console.log("start 1");
    while (1) {
        rtos.delay(20);
        console.log("task 1");
    }
}, 5);

rtos.createTask(() => {
    console.log("start 2");
    while (1) {
        rtos.delay(30);
        console.log("task 2");
    }
}, 13);
    `);
  const [transformedCode, setTransformedCode] = useState<string>('');


  const updateStatus = () => {
    setStatus(rtos.getSystemStatus());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        updateStatus();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  const startSystem = () => {
    rtos.start();
    setIsRunning(true);
    startCapture(); // 开始捕获 console.log
    console.log('🚀 系统已启动');
    updateStatus();
  };

  const stopSystem = () => {
    rtos.stop();
    setIsRunning(false);
    stopCapture(); // 停止捕获 console.log
    console.log('⏹️ 系统已停止');
    updateStatus();
  };

  const transformCode = () => {
        try {
          // 创建解析器
          const parser = new RTOSParser();
      
      console.log('🔄 开始转换代码...');
      
      // 解析并转换代码
      const transformed = parser.parseAndTransformToGenerator(originalCode);
      setTransformedCode(transformed);
      
      console.log('✅ 代码转换完成');
      console.log('📝 转换后的代码已显示在下方');
      
    } catch (error) {
      console.log(`❌ 转换出错: ${error}`);
    }
  };

  const runTaskParserExample = () => {
    console.log('=== 任务解析器示例 ===');
    
    // 如果系统没有运行，先启动系统
    if (!isRunning) {
      console.log('🚀 自动启动系统以运行任务...');
      rtos.start();
      setIsRunning(true);
      startCapture(); // 开始捕获 console.log
    }
    
    try {
      console.log('📝 执行原始代码中的任务...');
      
      // 创建一个安全的执行环境
      const executeCode = new Function('rtos', 'console', `
        ${originalCode}
      `);
      
      // 执行原始代码
      executeCode(rtos, console);
      
      console.log('✅ 原始代码执行完成，解析器会自动转换 delay() 为 yield');
      
      // 检查任务状态
      const status = rtos.getSystemStatus();
      console.log(`📊 当前状态: 总任务=${status.totalTasks}, 就绪=${status.readyTasks}, 阻塞=${status.blockedTasks}`);
    } catch (error) {
      console.log(`❌ 执行原始代码出错: ${error}`);
    }
    
    updateStatus();
  };


  return (
    <div className={styles.container}>
      <Typography.Title level={2}>任务解析器示例</Typography.Title>
      
      <Alert
        message="演示说明"
        description="创建包含 delay() 调用的任务，解析器会自动将 delay() 转换为 yield，实现真正的阻塞等待。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行状态"
              value={status.isRunning ? '运行中' : '停止'}
              valueStyle={{ color: status.isRunning ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="时钟节拍" value={status.tickCount} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总任务数" value={status.totalTasks} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="就绪任务" value={status.readyTasks} />
          </Card>
        </Col>
      </Row>

      <Card title="代码转换" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>原始代码：</Typography.Text>
            <TextArea
              value={originalCode}
              onChange={(e) => setOriginalCode(e.target.value)}
              placeholder="输入包含 rtos.delay() 的代码..."
              rows={8}
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
                rows={8}
                style={{ marginTop: 8, backgroundColor: '#f5f5f5' }}
              />
            </div>
          )}
        </Space>
      </Card>

      <Card title="控制面板" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={startSystem} 
            disabled={isRunning}
          >
            启动系统
          </Button>
          <Button 
            icon={<PauseCircleOutlined />}
            onClick={stopSystem} 
            disabled={!isRunning}
          >
            停止系统
          </Button>
          <Button 
            type="primary"
            icon={<CodeOutlined />}
            onClick={runTaskParserExample}
          >
            运行任务解析示例
          </Button>
        </Space>
      </Card>

    </div>
  );
};

export default TaskParserExample;
