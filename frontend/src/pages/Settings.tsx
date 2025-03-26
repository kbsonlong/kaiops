import React from 'react';
import { Card, Form, Input, Button, message } from 'antd';

const Settings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Success:', values);
    message.success('设置已保存');
  };

  return (
    <Card title="系统设置">
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
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="数据刷新间隔（秒）"
          name="refresh_interval"
          rules={[{ required: true, message: '请输入刷新间隔' }]}
        >
          <Input type="number" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Settings; 