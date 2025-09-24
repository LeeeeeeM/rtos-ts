import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { 
  CloseOutlined, 
  ClearOutlined, 
  CodeOutlined,
  MinusOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import styles from './LogContainer.module.css';

const { Text } = Typography;

interface LogEntry {
  id: number;
  message: string;
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'info';
}

interface LogContainerProps {
  logs: LogEntry[];
  onClear: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

const LogContainer: React.FC<LogContainerProps> = ({ 
  logs, 
  onClear, 
  isVisible, 
  onToggle 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // 处理拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).closest('.ant-card-head')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, dragStart]);

  if (!isVisible) {
    return (
      <div 
        className={styles.floatingButton}
        onClick={onToggle}
        title="显示日志控制台"
      >
        <CodeOutlined />
        {logs.length > 0 && (
          <span className={styles.logCount}>{logs.length}</span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.logContainer} ${isMinimized ? styles.minimized : ''}`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <Card
        size="small"
        title={
          <div className={styles.cardHeader}>
            <Space>
              <CodeOutlined />
              <Text strong>任务日志</Text>
              {logs.length > 0 && (
                <Text type="secondary">({logs.length})</Text>
              )}
            </Space>
          </div>
        }
        extra={
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={isMinimized ? <FullscreenOutlined /> : <MinusOutlined />}
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? '展开' : '最小化'}
            />
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={onClear}
              disabled={logs.length === 0}
              title="清空日志"
            />
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onToggle}
              title="关闭"
            />
          </Space>
        }
        className={styles.card || ''}
      >
        {!isMinimized && (
          <div className={styles.logsContainer}>
            {logs.length === 0 ? (
              <div className={styles.emptyLogs}>
                <Text type="secondary">暂无日志输出</Text>
              </div>
            ) : (
              <div className={styles.logs}>
                {logs.map((log) => (
                  <div key={log.id} className={`${styles.logItem} ${styles[log.type]}`}>
                    <span className={styles.timestamp}>[{log.timestamp}]</span>
                    <span className={styles.message}>{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default LogContainer;
