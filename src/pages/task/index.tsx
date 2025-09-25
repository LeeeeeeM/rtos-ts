import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Typography, Alert, Input } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, CodeOutlined } from '@ant-design/icons';
import { RTOS } from '../../../lib/rtos';
import { SchedulerConfig } from '../../../lib/types';
import { useLog } from '../../contexts/LogContext';
import styles from './index.module.css';

const { TextArea } = Input;

const TaskExample: React.FC = () => {
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
  const isRunningRef = useRef(false);
  const [taskCode, setTaskCode] = useState(
`
rtos.createTask((rtos) => {
    console.log("start 1");
    while (1) {
        rtos.delay(20);
        console.log("task 1");
    }
}, 5);

rtos.createTask((rtos) => {
    console.log("start 2");
    while (1) {
        rtos.delay(30);
        console.log("task 2");
    }
}, 13);
`
);


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


  const runTaskExample = () => {
    console.log('=== 任务调度示例 ===');
    
    // 如果系统没有运行，先启动系统
    if (!isRunningRef.current) {
      console.log('🚀 自动启动系统以运行任务...');
      rtos.start();
      setIsRunning(true);
      isRunningRef.current = true;
      startCapture(); // 开始捕获 console.log
    }
    
    try {
      console.log('📝 执行原始代码中的任务...');
      
      // 创建一个安全的执行环境
      const executeCode = new Function('rtos', 'console', `
        ${taskCode}
      `);
      
      // 执行任务代码
      executeCode(rtos, console);
      
    } catch (error) {
      console.log(`❌ 执行原始代码出错: ${error}`);
    }
    
    updateStatus();
  };


  return (
    <div className={styles.container}>
      <Typography.Title level={2}>任务调度示例</Typography.Title>
      
      <Alert
        message="演示说明"
        description="这个页面演示任务解析器的实际运行效果。解析器会自动将任务函数中的 delay() 调用转换为 yield，实现真正的阻塞等待。"
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

      <Card title="任务代码" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>任务代码：</Typography.Text>
            <Typography.Text type="secondary">
              （可以编辑任务代码，然后点击"运行任务示例"来执行）
            </Typography.Text>
            <TextArea
              value={taskCode}
              onChange={(e) => setTaskCode(e.target.value)}
              placeholder="输入包含 rtos.delay() 的任务代码..."
              rows={8}
              style={{ marginTop: 8 }}
            />
          </div>
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
            onClick={runTaskExample}
          >
            运行任务示例
          </Button>
        </Space>
      </Card>

    </div>
  );
};

export default TaskExample;
