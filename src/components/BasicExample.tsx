import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Typography, Alert, Input } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ClearOutlined, CopyOutlined } from '@ant-design/icons';
import { RTOS } from '../../lib/rtos';
import { SchedulerConfig } from '../../lib/types';
import styles from './BasicExample.module.css';

const BasicExample: React.FC = () => {
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


  const runBasicExample = () => {
    log('=== 基本任务示例 ===');
    
    // 如果系统没有运行，先启动系统
    if (!isRunning) {
      log('🚀 自动启动系统以运行任务...');
      rtos.start();
      setIsRunning(true);
    }
    
    // 创建高优先级任务
    rtos.createTask(
      () => {
        log('🔥 高优先级任务开始运行');
        rtos.delay(10);
        log('🔥 高优先级任务延时结束');
      },
      10,
      2048,
      undefined,
      'HighPriorityTask'
    );

    // 创建中优先级任务
    rtos.createTask(
      () => {
        log('⚡ 中优先级任务开始运行');
        rtos.delay(20);
        log('⚡ 中优先级任务延时结束');
      },
      5,
      2048,
      undefined,
      'MediumPriorityTask'
    );

    // 创建低优先级任务
    rtos.createTask(
      () => {
        log('🐌 低优先级任务开始运行');
        rtos.delay(30);
        log('🐌 低优先级任务延时结束');
      },
      1,
      2048,
      undefined,
      'LowPriorityTask'
    );

    log('📝 已创建示例任务');
    updateStatus();
    
    // 让出 CPU 给新创建的任务执行
    rtos.yield();
  };

  const clearOutput = () => {
    setOutput('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      log('📋 代码已复制到剪贴板');
    });
  };

  const basicExampleCode = `// 运行基本示例
const runBasicExample = () => {
  // 如果系统没有运行，先启动系统
  if (!rtos.isRunning()) {
    rtos.start();
  }
  
  // 创建高优先级任务
  rtos.createTask(
    () => {
      console.log('🔥 高优先级任务运行');
      rtos.delay(10); // 延时1秒
    },
    10, // 优先级
    2048, // 栈大小
    undefined, // 参数
    'HighPriorityTask' // 任务名称
  );

  // 创建中优先级任务
  rtos.createTask(
    () => {
      console.log('⚡ 中优先级任务运行');
      rtos.delay(20); // 延时2秒
    },
    5, // 优先级
    2048, // 栈大小
    undefined, // 参数
    'MediumPriorityTask' // 任务名称
  );

  // 创建低优先级任务
  rtos.createTask(
    () => {
      console.log('🐌 低优先级任务运行');
      rtos.delay(30); // 延时3秒
    },
    1, // 优先级
    2048, // 栈大小
    undefined, // 参数
    'LowPriorityTask' // 任务名称
  );
  
  // 让出 CPU 给新创建的任务执行
  rtos.yield();
};`;


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
          <Button onClick={runBasicExample}>
            运行基本示例
          </Button>
          <Button 
            icon={<ClearOutlined />}
            onClick={clearOutput}
          >
            清空输出
          </Button>
        </Space>
      </Card>

      <Card 
        title="运行基本示例代码" 
        extra={
          <Button 
            size="small" 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(basicExampleCode)}
          >
            复制
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Input.TextArea
          value={basicExampleCode}
          readOnly
          autoSize={{ minRows: 15, maxRows: 20 }}
          style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace', fontSize: '12px' }}
        />
      </Card>

      <Card title="系统输出">
        <div className={styles.output}>{output}</div>
      </Card>
    </div>
  );
};

export default BasicExample;
