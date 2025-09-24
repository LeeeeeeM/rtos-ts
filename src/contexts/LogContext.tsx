import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LogEntry {
  id: number;
  message: string;
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'info';
}

interface LogContextType {
  logs: LogEntry[];
  isVisible: boolean;
  isCapturing: boolean;
  addLog: (message: string, type?: 'log' | 'warn' | 'error' | 'info') => void;
  clearLogs: () => void;
  toggleVisibility: () => void;
  startCapture: () => void;
  stopCapture: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

let logId = 0;

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const addLog = useCallback((message: string, type: 'log' | 'warn' | 'error' | 'info' = 'log') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: LogEntry = {
      id: logId++,
      message,
      timestamp,
      type
    };
    
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const startCapture = useCallback(() => {
    if (isCapturing) return;

    setIsCapturing(true);
    
    // 保存原始的 console 方法
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    // 重写 console.log
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'log');
      originalLog.apply(console, args);
    };

    // 重写 console.warn
    console.warn = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'warn');
      originalWarn.apply(console, args);
    };

    // 重写 console.error
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'error');
      originalError.apply(console, args);
    };

    // 重写 console.info
    console.info = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'info');
      originalInfo.apply(console, args);
    };

    // 返回恢复函数
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
      setIsCapturing(false);
    };
  }, [isCapturing, addLog]);

  const stopCapture = useCallback(() => {
    setIsCapturing(false);
  }, []);

  const value: LogContextType = {
    logs,
    isVisible,
    isCapturing,
    addLog,
    clearLogs,
    toggleVisibility,
    startCapture,
    stopCapture
  };

  return (
    <LogContext.Provider value={value}>
      {children}
    </LogContext.Provider>
  );
};

export const useLog = () => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};
