import React from 'react';
import { Form, Input, InputNumber, Button, Space, Select, Card, Divider, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { Deployment, StatefulSet, DaemonSet } from '../services/workload';

const { Option } = Select;

interface WorkloadFormProps {
  type: 'deployment' | 'statefulset' | 'daemonset';
  initialValues?: Partial<Deployment | StatefulSet | DaemonSet>;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const WorkloadForm: React.FC<WorkloadFormProps> = ({
  type,
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      message.error('表单验证失败，请检查输入');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Form.Item
          name={['metadata', 'name']}
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="请输入工作负载名称" />
        </Form.Item>

        <Form.Item
          name={['metadata', 'namespace']}
          label="命名空间"
          rules={[{ required: true, message: '请选择命名空间' }]}
        >
          <Select placeholder="请选择命名空间">
            <Option value="default">default</Option>
            <Option value="kube-system">kube-system</Option>
            {/* 可以添加更多命名空间选项 */}
          </Select>
        </Form.Item>

        {(type === 'deployment' || type === 'statefulset') && (
          <Form.Item
            name={['spec', 'replicas']}
            label="副本数"
            rules={[{ required: true, message: '请输入副本数' }]}
          >
            <InputNumber min={1} placeholder="请输入副本数" />
          </Form.Item>
        )}

        {type === 'statefulset' && (
          <Form.Item
            name={['spec', 'serviceName']}
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input placeholder="请输入服务名称" />
          </Form.Item>
        )}
      </Card>

      <Card title="容器配置" style={{ marginBottom: 16 }}>
        <Form.List name={['spec', 'template', 'spec', 'containers']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card key={key} style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        label="容器名称"
                        rules={[{ required: true, message: '请输入容器名称' }]}
                      >
                        <Input placeholder="请输入容器名称" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>

                    <Form.Item
                      {...restField}
                      name={[name, 'image']}
                      label="镜像"
                      rules={[{ required: true, message: '请输入镜像地址' }]}
                    >
                      <Input placeholder="请输入镜像地址" />
                    </Form.Item>

                    <Form.List name={[name, 'ports']}>
                      {(portFields, { add: addPort, remove: removePort }) => (
                        <>
                          {portFields.map((portField, index) => (
                            <Space key={portField.key} align="baseline">
                              <Form.Item
                                {...portField}
                                name={[portField.name, 'containerPort']}
                                label="容器端口"
                                rules={[{ required: true, message: '请输入容器端口' }]}
                              >
                                <InputNumber min={1} max={65535} placeholder="容器端口" />
                              </Form.Item>
                              <Form.Item
                                {...portField}
                                name={[portField.name, 'protocol']}
                                label="协议"
                                rules={[{ required: true, message: '请选择协议' }]}
                              >
                                <Select placeholder="请选择协议">
                                  <Option value="TCP">TCP</Option>
                                  <Option value="UDP">UDP</Option>
                                </Select>
                              </Form.Item>
                              <MinusCircleOutlined onClick={() => removePort(portField.name)} />
                            </Space>
                          ))}
                          <Form.Item>
                            <Button type="dashed" onClick={() => addPort()} block icon={<PlusOutlined />}>
                              添加端口
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </Space>
                </Card>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加容器
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Card title="标签选择器">
        <Form.List name={['spec', 'selector', 'matchLabels']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'key']}
                    label="键"
                    rules={[{ required: true, message: '请输入键' }]}
                  >
                    <Input placeholder="请输入键" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'value']}
                    label="值"
                    rules={[{ required: true, message: '请输入值' }]}
                  >
                    <Input placeholder="请输入值" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加标签
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Divider />

      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            提交
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default WorkloadForm; 