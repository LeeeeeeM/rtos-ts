import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Typography, Alert, Input } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, CopyOutlined, PauseOutlined, CaretRightOutlined, CodeOutlined } from '@ant-design/icons';
import { RTOS } from '../../../lib/rtos';
import { SchedulerConfig, TaskHandle } from '../../../lib/types';
import { useLog } from '../../contexts/LogContext';
import styles from './index.module.css';

const { TextArea } = Input;

const SuspendExample: React.FC = () => {
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
  const [taskHandle, setTaskHandle] = useState<TaskHandle | null>(null);
  const isRunningRef = useRef(false);
  
  // 任务代码编辑
  const [taskCode, setTaskCode] = useState(`const taskHandle = rtos.createTask(
  () => {
    console.log('任务开始运行');
    let count = 0;
    while (count < 10) {
      count++;
      console.log(\`任务运行第 \${count} 次\`);
      rtos.delay(10); // 延时1秒
    }
    console.log('任务完成');
  },
  5, // 优先级
  2048, // 栈大小
  undefined, // 参数
  'SuspendableTask' // 任务名称
);

return taskHandle;`);


  const updateStatus = () => {
    setStatus(rtos.getSystemStatus());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        updateStatus();
        
        // 检查任务是否已完成
        if (taskHandle) {
          const taskInfo = rtos.getTaskInfo(taskHandle);
          if (!taskInfo) {
            // 任务不存在，说明已完成或被删除
            setTaskHandle(null);
            console.log('📋 任务已完成，可以创建新任务');
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, taskHandle]);

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

  const createSuspendableTask = () => {
    if (!isRunningRef.current) {
      console.log('❌ 请先启动系统');
      return;
    }

    if (taskHandle) {
      console.log('❌ 任务已存在，请先删除或等待完成');
      return;
    }

    try {
      console.log('📝 执行任务代码...');
      
      // 创建一个安全的执行环境，支持任务创建和句柄获取
      const executeCode = new Function('rtos', 'console', 'log', `
        ${taskCode}
      `);
      
      // 创建 log 函数
      const log = (message: string) => {
        console.log(`[Task] ${message}`);
      };
      
      // 执行任务代码
      const result = executeCode(rtos, console, log);
      
      // 如果代码返回了句柄，使用它
      if (result && typeof result === 'number') {
        setTaskHandle(result);
        console.log(`📋 创建任务，句柄: ${result}`);
      } else {
        // 如果没有返回句柄，尝试从代码中提取
        // 这里我们需要修改代码，让用户明确返回句柄
        console.log('❌ 任务创建失败，请确保代码返回任务句柄');
        console.log('💡 提示：请在代码末尾添加 "return taskHandle;" 或直接返回 rtos.createTask 的结果');
      }
      
      updateStatus();
      
      // 让出 CPU 给新创建的任务执行
      rtos.yield();
    } catch (error) {
      console.log(`❌ 执行任务代码出错: ${error}`);
    }
  };

  const suspendTask = () => {
    if (!taskHandle) {
      console.log('❌ 没有可挂起的任务');
      return;
    }

    const success = rtos.suspendTask(taskHandle);
    if (success) {
      console.log('⏸️ 任务已挂起');
    } else {
      console.log('❌ 挂起任务失败');
    }
    updateStatus();
  };

  const resumeTask = () => {
    if (!taskHandle) {
      console.log('❌ 没有可恢复的任务');
      return;
    }

    const success = rtos.resumeTask(taskHandle);
    if (success) {
      console.log('▶️ 任务已恢复');
    } else {
      console.log('❌ 恢复任务失败');
    }
    updateStatus();
  };

  const deleteTask = () => {
    if (!taskHandle) {
      console.log('❌ 没有可删除的任务');
      return;
    }

    const success = rtos.deleteTask(taskHandle);
    if (success) {
      console.log('🗑️ 任务已删除');
      setTaskHandle(null);
    } else {
      console.log('❌ 删除任务失败');
    }
    updateStatus();
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('📋 代码已复制到剪贴板');
    });
  };


  return (
    <div className={styles.container}>
      <Typography.Title level={2}>任务挂起示例</Typography.Title>
      
      <Alert
        message="演示说明"
        description="演示任务的挂起、恢复和删除功能。挂起的任务不会参与调度，恢复后会继续执行。"
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
            type="primary"
            icon={<CodeOutlined />}
            onClick={createSuspendableTask}
            disabled={!isRunning || !!taskHandle}
          >
            运行任务代码
          </Button>
          <Button 
            icon={<PauseOutlined />}
            onClick={suspendTask}
            disabled={!taskHandle}
          >
            挂起任务
          </Button>
          <Button 
            icon={<CaretRightOutlined />}
            onClick={resumeTask}
            disabled={!taskHandle}
          >
            恢复任务
          </Button>
          <Button 
            danger
            onClick={deleteTask}
            disabled={!taskHandle}
          >
            删除任务
          </Button>
        </Space>
      </Card>

      <Card 
        title="任务代码编辑" 
        size="small"
        extra={
          <Button 
            size="small" 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(taskCode)}
          >
            复制
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <TextArea
          value={taskCode}
          onChange={(e) => setTaskCode(e.target.value)}
          placeholder="输入完整的 rtos.createTask 调用代码..."
          rows={10}
          style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace', fontSize: '12px' }}
        />
      </Card>


    </div>
  );
};

export default SuspendExample;
