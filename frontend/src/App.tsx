import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ClusterOutlined,
  SettingOutlined,
  CloudServerOutlined,
  ApiOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Clusters from './pages/Clusters';
import ClusterDetail from './pages/ClusterDetail';
import Settings from './pages/Settings';
import Workloads from './pages/Workloads';

const { Header, Sider, Content } = Layout;

const AppContent: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>(['dashboard']);
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: 'clusters',
      icon: <ClusterOutlined />,
      label: '集群管理',
      children: [
        {
          key: '/clusters',
          label: '集群列表',
        },
      ],
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedKeys([key]);
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header 
          style={{ 
            padding: 0, 
            background: '#fff',
            position: 'fixed',
            top: 0,
            right: 0,
            left: collapsed ? 80 : 200,
            zIndex: 999,
            transition: 'all 0.2s',
            height: 64,
            lineHeight: '64px',
          }} 
        />
        <Content 
          style={{ 
            margin: '64px 0 0',
            padding: 0,
            background: '#fff',
            minHeight: 280,
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clusters" element={<Clusters />} />
            <Route path="/clusters/:id" element={<ClusterDetail />} />
            <Route path="/clusters/:id/workloads" element={<Workloads />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
