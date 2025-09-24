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
  
  // 保存原始的 console 方法
  const originalConsole = React.useRef({
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  });

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
    
    // 重写 console.log
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'log');
      originalConsole.current.log.apply(console, args);
    };

    // 重写 console.warn
    console.warn = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'warn');
      originalConsole.current.warn.apply(console, args);
    };

    // 重写 console.error
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'error');
      originalConsole.current.error.apply(console, args);
    };

    // 重写 console.info
    console.info = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'info');
      originalConsole.current.info.apply(console, args);
    };
  }, [isCapturing, addLog]);

  const stopCapture = useCallback(() => {
    if (!isCapturing) return;
    
    setIsCapturing(false);
    
    // 恢复原始的 console 方法
    console.log = originalConsole.current.log;
    console.warn = originalConsole.current.warn;
    console.error = originalConsole.current.error;
    console.info = originalConsole.current.info;
  }, [isCapturing]);

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
