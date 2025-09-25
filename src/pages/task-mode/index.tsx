import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Typography, Alert, Input } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, CodeOutlined } from '@ant-design/icons';
import { RTOS } from '../../../lib/rtos';
import { useLog } from '../../contexts/LogContext';
import styles from './index.module.css';

const { TextArea } = Input;

const TaskModePage: React.FC = () => {
  const { startCapture, stopCapture } = useLog();
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  
  // 创建独立的 RTOS 实例
  const [rtos] = useState(() => {
    const config = {
      maxTasks: 10,
      tickRate: 10,
      stackSize: 4096,
      idleTaskStackSize: 1024,
    };
    return new RTOS(config);
  });
  const [status, setStatus] = useState(rtos.getSystemStatus());
  
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
    startCapture();
    console.log('🚀 系统已启动');
    updateStatus();
  };

  const stopSystem = () => {
    rtos.stop();
    setIsRunning(false);
    isRunningRef.current = false;
    stopCapture();
    console.log('⏹️ 系统已停止');
    updateStatus();
  };

  const runTaskExample = (yieldAllStatements: boolean) => {
    console.log(`=== 执行原始代码（${yieldAllStatements ? '全部 yield' : 'delay yield'} 模式） ===`);
    
    // 设置 RTOS 的 yield 模式
    rtos.setYieldMode(yieldAllStatements);
    
    // 如果系统没有运行，先启动系统
    if (!isRunningRef.current) {
      console.log('🚀 自动启动系统以运行任务...');
      rtos.start();
      setIsRunning(true);
      isRunningRef.current = true;
      startCapture();
    }
    
    try {
      console.log('📝 执行原始代码，RTOS 内部会根据当前模式自动转换...');
      console.log('当前模式:', rtos.getYieldMode() ? "所有语句转 yield" : "仅 delay 转 yield");
      
      // 创建一个安全的执行环境
      const executeCode = new Function('rtos', 'console', `
        ${taskCode}
      `);
      
      // 执行原始代码，RTOS 内部会自动转换
      executeCode(rtos, console);
      
      console.log('✅ 原始代码执行完成，RTOS 内部已自动转换');
      
    } catch (error) {
      console.log(`❌ 执行原始代码出错: ${error}`);
    }
    
    updateStatus();
  };

  return (
    <div className={styles.container}>
      <Typography.Title level={2}>任务执行模式</Typography.Title>
      
      <Alert
        message="任务执行模式"
        description="这个示例包含3个任务，可以清楚看到两种执行模式的效果。点击下方按钮可以直接执行原始代码，RTOS 内部会根据选择的模式自动转换。"
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
              （可以编辑任务代码，然后点击下方按钮来执行）
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
            onClick={() => runTaskExample(true)}
          >
            执行原始代码（全部 yield 模式）
          </Button>
          <Button 
            icon={<CodeOutlined />}
            onClick={() => runTaskExample(false)}
          >
            执行原始代码（delay yield 模式）
          </Button>
        </Space>
      </Card>

    </div>
  );
};

export default TaskModePage;
