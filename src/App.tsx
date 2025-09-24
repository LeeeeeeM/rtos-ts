import {
  BrowserRouter as Router,
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
} from "@ant-design/icons";
import BasicExample from "./components/BasicExample";
import TaskParserExample from "./components/TaskParserExample";
import SuspendExample from "./components/SuspendExample";
import styles from "./App.module.css";

const { Sider, Content } = Layout;

function AppContent() {
  const location = useLocation();

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
      key: "/task-parser",
      icon: <FunctionOutlined />,
      label: <Link to="/task-parser">任务解析器</Link>,
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
              <Route path="/task-parser" element={<TaskParserExample />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
