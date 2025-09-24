import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Typography, Alert, Input } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, CopyOutlined, CodeOutlined } from '@ant-design/icons';
import { RTOS } from '../../../lib/rtos';
import { SchedulerConfig } from '../../../lib/types';
import { useLog } from '../../contexts/LogContext';
import styles from './index.module.css';

const { TextArea } = Input;

const BasicExample: React.FC = () => {
  const { startCapture, stopCapture } = useLog();
  
  // 创建独立的 RTOS 实例
  const [rtos] = useState(() => {
    const config: SchedulerConfig = {
      maxTasks: 10,
      tickRate: 10,
      stackSize: 4096,
      idleTaskStackSize: 1024,
    };
    return new RTOS(config);
  });
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState(rtos.getSystemStatus());
  const isRunningRef = useRef(false);
  
  // 三个独立的任务代码块
  const [highPriorityCode, setHighPriorityCode] = useState(`// 创建高优先级任务
rtos.createTask(
  () => {
    console.log('🔥 高优先级任务运行');
    rtos.delay(10); // 延时1秒
    console.log('🔥 高优先级任务运行完成');
  },
  10, // 优先级
  2048, // 栈大小
  undefined, // 参数
  'HighPriorityTask' // 任务名称
);`);

  const [mediumPriorityCode, setMediumPriorityCode] = useState(`// 创建中优先级任务
rtos.createTask(
  () => {
    console.log('⚡ 中优先级任务运行');
    rtos.delay(20); // 延时2秒
    console.log('⚡ 中优先级任务运行完成');
  },
  5, // 优先级
  2048, // 栈大小
  undefined, // 参数
  'MediumPriorityTask' // 任务名称
);`);

  const [lowPriorityCode, setLowPriorityCode] = useState(`// 创建低优先级任务
rtos.createTask(
  () => {
    console.log('🐌 低优先级任务运行');
    rtos.delay(30); // 延时3秒
    console.log('🐌 低优先级任务运行完成');
  },
  1, // 优先级
  2048, // 栈大小
  undefined, // 参数
  'LowPriorityTask' // 任务名称
);`);


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

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (isRunningRef.current) {
        rtos.stop();
        stopCapture();
      }
    };
  }, []);

  const startSystem = () => {
    rtos.start();
    setIsRunning(true);
    isRunningRef.current = true;
    startCapture(); // 开始捕获 console.log
    console.log('🚀 系统已启动');
    updateStatus();
  };

  const stopSystem = () => {
    rtos.stop();
    setIsRunning(false);
    isRunningRef.current = false;
    stopCapture(); // 停止捕获 console.log
    console.log('⏹️ 系统已停止');
    updateStatus();
  };


  const runBasicExample = () => {
    console.log('=== 基本任务示例 ===');
    
    // 如果系统没有运行，先启动系统
    if (!isRunningRef.current) {
      console.log('🚀 自动启动系统以运行任务...');
      rtos.start();
      setIsRunning(true);
      isRunningRef.current = true;
      startCapture(); // 开始捕获 console.log
    }
    
    try {
      const executeHighPriority = new Function('rtos', 'console', 'log', `
        ${highPriorityCode}
      `);
      const log = (message: string) => {
        console.log(`[Task] ${message}`);
      };
      executeHighPriority(rtos, console, log);

      const executeMediumPriority = new Function('rtos', 'console', 'log', `
        ${mediumPriorityCode}
      `);
      executeMediumPriority(rtos, console, log);

      const executeLowPriority = new Function('rtos', 'console', 'log', `
        ${lowPriorityCode}
      `);
      executeLowPriority(rtos, console, log);

      updateStatus();
      
      // 让出 CPU 给新创建的任务执行
      rtos.yield();
    } catch (error) {
      console.log(`❌ 创建任务时出错: ${error}`);
    }
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('📋 代码已复制到剪贴板');
    });
  };



  return (
    <div className={styles.container}>
      <Typography.Title level={2}>基本任务调度示例</Typography.Title>
      
      <Alert
        message="演示说明"
        description="演示基本的任务创建、优先级调度和延时功能。高优先级任务会优先执行。"
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
            onClick={runBasicExample}
          >
            运行所有任务
          </Button>
        </Space>
      </Card>

      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 24 }}>
        <Card 
          title="🔥 高优先级任务 (优先级: 10)" 
          size="small"
          extra={
            <Button 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(highPriorityCode)}
            >
              复制
            </Button>
          }
        >
          <TextArea
            value={highPriorityCode}
            onChange={(e) => setHighPriorityCode(e.target.value)}
            placeholder="输入完整的 rtos.createTask 调用代码..."
            rows={6}
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace', fontSize: '12px' }}
          />
        </Card>

        <Card 
          title="⚡ 中优先级任务 (优先级: 5)" 
          size="small"
          extra={
            <Button 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(mediumPriorityCode)}
            >
              复制
            </Button>
          }
        >
          <TextArea
            value={mediumPriorityCode}
            onChange={(e) => setMediumPriorityCode(e.target.value)}
            placeholder="输入完整的 rtos.createTask 调用代码..."
            rows={6}
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace', fontSize: '12px' }}
          />
        </Card>

        <Card 
          title="🐌 低优先级任务 (优先级: 1)" 
          size="small"
          extra={
            <Button 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(lowPriorityCode)}
            >
              复制
            </Button>
          }
        >
          <TextArea
            value={lowPriorityCode}
            onChange={(e) => setLowPriorityCode(e.target.value)}
            placeholder="输入完整的 rtos.createTask 调用代码..."
            rows={6}
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace', fontSize: '12px' }}
          />
        </Card>
      </Space>


    </div>
  );
};

export default BasicExample;
