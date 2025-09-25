import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  PlayCircleOutlined,
  FunctionOutlined,
  PauseOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import BasicExample from "./pages/basic";
import TaskExample from "./pages/task";
import SuspendExample from "./pages/suspend";
import CodeTransformPage from "./pages/code-transform";
import TaskModePage from "./pages/task-mode";
import LogContainer from "./components/LogContainer";
import { LogProvider, useLog } from "./contexts/LogContext";
import styles from "./App.module.css";

const { Sider, Content } = Layout;

function AppContent() {
  const location = useLocation();
  const { logs, isVisible, clearLogs, toggleVisibility } = useLog();

  const menuItems = [
    {
      key: "/basic",
      icon: <PlayCircleOutlined />,
      label: <Link to="/basic">基本任务调度</Link>,
    },
    {
      key: "/suspend",
      icon: <PauseOutlined />,
      label: <Link to="/suspend">任务挂起</Link>,
    },
    {
      key: "/task",
      icon: <FunctionOutlined />,
      label: <Link to="/task">任务调度</Link>,
    },
    {
      key: "/code-transform",
      icon: <CodeOutlined />,
      label: <Link to="/code-transform">代码转换</Link>,
    },
    {
      key: "/task-mode",
      icon: <PlayCircleOutlined />,
      label: <Link to="/task-mode">任务执行模式</Link>,
    },
  ];

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <h1>🚀 TypeScript RTOS</h1>
        <p>实时操作系统演示 - 类似 FreeRTOS 的 TypeScript 实现</p>
      </div>

      <Layout>
        <Sider width={250} style={{ background: "#fff" }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: "100%", borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content style={{ margin: "24px 0" }}>
            <Routes>
              <Route path="/" element={<Navigate to="/basic" replace />} />
              <Route path="/basic" element={<BasicExample />} />
              <Route path="/suspend" element={<SuspendExample />} />
              <Route path="/task" element={<TaskExample />} />
              <Route path="/code-transform" element={<CodeTransformPage />} />
              <Route path="/task-mode" element={<TaskModePage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
      
      <LogContainer
        logs={logs}
        onClear={clearLogs}
        isVisible={isVisible}
        onToggle={toggleVisibility}
      />
    </div>
  );
}

function App() {
  return (
    <LogProvider>
      <Router>
        <AppContent />
      </Router>
    </LogProvider>
  );
}

export default App;
