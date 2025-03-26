import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      // TODO: 实现设置保存逻辑
      console.log('Success:', values);
      message.success('设置已保存');
    } catch (error) {
      message.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info('已重置表单');
  };

  return (
    <div style={{ padding: isMobile ? '12px' : '24px' }}>
      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>系统设置</Title>
            <Text type="secondary">配置系统运行参数</Text>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            api_url: 'http://localhost:3000/api/v1',
            refresh_interval: '30',
          }}
        >
          <Form.Item
            label="API 地址"
            name="api_url"
            rules={[{ required: true, message: '请输入 API 地址' }]}
            tooltip="系统API接口地址"
          >
            <Input placeholder="请输入API地址" />
          </Form.Item>

          <Form.Item
            label="数据刷新间隔（秒）"
            name="refresh_interval"
            rules={[
              { required: true, message: '请输入刷新间隔' },
              { type: 'number', min: 5, message: '刷新间隔不能小于5秒' },
              { type: 'number', max: 3600, message: '刷新间隔不能大于1小时' }
            ]}
            tooltip="数据自动刷新的时间间隔"
          >
            <Input type="number" min={5} max={3600} placeholder="请输入刷新间隔" />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space size="middle">
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={loading}
                size={isMobile ? 'large' : 'middle'}
              >
                保存设置
              </Button>
              <Button 
                onClick={handleReset}
                icon={<ReloadOutlined />}
                size={isMobile ? 'large' : 'middle'}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings; 