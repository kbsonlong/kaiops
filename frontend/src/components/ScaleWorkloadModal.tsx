import React from 'react';
import { Modal, Form, InputNumber, message } from 'antd';
import type { Workload } from '../services/workload';

interface ScaleWorkloadModalProps {
  visible: boolean;
  workload: Workload | null;
  onCancel: () => void;
  onOk: (replicas: number) => Promise<void>;
  loading?: boolean;
}

const ScaleWorkloadModal: React.FC<ScaleWorkloadModalProps> = ({
  visible,
  workload,
  onCancel,
  onOk,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onOk(values.replicas);
    } catch (error) {
      message.error('请输入有效的副本数');
    }
  };

  const getCurrentReplicas = () => {
    if (!workload) return 1;
    switch (workload.kind.toLowerCase()) {
      case 'deployment':
        return (workload as any).spec.replicas || 1;
      case 'statefulset':
        return (workload as any).spec.replicas || 1;
      case 'daemonset':
        return (workload as any).status.desiredNumberScheduled || 1;
      default:
        return 1;
    }
  };

  return (
    <Modal
      title={`扩缩容 ${workload?.metadata.name || ''}`}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ replicas: getCurrentReplicas() }}
      >
        <Form.Item
          name="replicas"
          label="副本数"
          rules={[
            { required: true, message: '请输入副本数' },
            { type: 'number', min: 0, message: '副本数必须大于等于0' }
          ]}
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="请输入副本数"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ScaleWorkloadModal;