import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Typography, Alert } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, MonitorOutlined, ClearOutlined } from '@ant-design/icons';
import { RTOS } from '../../lib/rtos';
import { SchedulerConfig } from '../../lib/types';
import styles from './BasicExample.module.css';

const MonitorExample: React.FC = () => {
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
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState(rtos.getSystemStatus());

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput(prev => prev + `[${timestamp}] ${message}\n`);
  };

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
    log('🚀 系统已启动');
    updateStatus();
  };

  const stopSystem = () => {
    rtos.stop();
    setIsRunning(false);
    log('⏹️ 系统已停止');
    updateStatus();
  };

  const runMonitorExample = () => {
    log('=== 状态监控示例 ===');
    
    // 如果系统没有运行，先启动系统
    if (!isRunning) {
      log('🚀 自动启动系统以运行监控...');
      rtos.start();
      setIsRunning(true);
    }
    
    // 创建监控任务
    rtos.createTask(() => {
      log('📊 监控任务开始运行');
      let count = 0;
      while (count < 10) {
        const status = rtos.getSystemStatus();
        log('=== 系统状态 ===');
        log(`运行状态: ${status.isRunning}`);
        log(`时钟节拍: ${status.tickCount}`);
        log(`当前任务: ${status.currentTask}`);
        log(`就绪任务数: ${status.readyTasks}`);
        log(`阻塞任务数: ${status.blockedTasks}`);
        log(`挂起任务数: ${status.suspendedTasks}`);
        log(`总任务数: ${status.totalTasks}`);
        log('================');
        rtos.delay(30);
        count++;
      }
      log('📊 监控任务完成');
    }, 2, 2048, undefined, 'Monitor');

    log('📊 已创建监控演示任务');
    updateStatus();
  };

  const clearOutput = () => {
    setOutput('');
  };

  return (
    <div className={styles.container}>
      <Typography.Title level={2}>状态监控示例</Typography.Title>
      
      <Alert
        message="演示说明"
        description="演示系统状态监控功能，实时显示任务状态和系统信息。"
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
            <Statistic title="当前任务" value={status.currentTask || '无'} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="就绪任务" value={status.readyTasks} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="阻塞任务" value={status.blockedTasks} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="挂起任务" value={status.suspendedTasks} />
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
            icon={<MonitorOutlined />}
            onClick={runMonitorExample}
          >
            运行监控示例
          </Button>
          <Button 
            icon={<ClearOutlined />}
            onClick={clearOutput}
          >
            清空输出
          </Button>
        </Space>
      </Card>

      <Card title="系统输出">
        <div className={styles.output}>{output}</div>
      </Card>
    </div>
  );
};

export default MonitorExample;
