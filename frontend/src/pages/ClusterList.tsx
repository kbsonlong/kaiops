import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloudServerOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { clusterService, Cluster } from '../services/cluster';

const { Option } = Select;

const ClusterList: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const response = await clusterService.getClusters(current, pageSize);
      console.log('API Response:', response);
      
      // 验证数据
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response data format');
      }
      
      // 确保每个集群对象都有 ID
      const validClusters = response.data.filter((cluster: Cluster) => {
        if (!cluster.ID) {
          console.error('Invalid cluster data:', cluster);
          return false;
        }
        return true;
      });
      
      console.log('Valid Clusters:', validClusters);
      setClusters(validClusters);
      setTotal(response.meta.total);
    } catch (error) {
      message.error('获取集群列表失败');
      console.error('Error fetching clusters:', error);
      setClusters([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [current, pageSize]);

  const handleCreate = () => {
    setEditingCluster(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Cluster) => {
    setEditingCluster(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await clusterService.deleteCluster(id);
      message.success('删除成功');
      fetchClusters();
    } catch (error) {
      message.error('删除失败');
      console.error('Error deleting cluster:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCluster) {
        await clusterService.updateCluster(editingCluster.ID, values);
        message.success('更新成功');
      } else {
        await clusterService.createCluster(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchClusters();
    } catch (error) {
      message.error('操作失败');
      console.error('Error saving cluster:', error);
    }
  };

  const columns = [
    {
      title: '集群名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '中文名称',
      dataIndex: 'cn_name',
      key: 'cn_name',
    },
    {
      title: '类型',
      dataIndex: 'cluster_type',
      key: 'cluster_type',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '版本',
      dataIndex: 'cluster_version',
      key: 'cluster_version',
    },
    {
      title: '区域',
      dataIndex: 'cluster_region',
      key: 'cluster_region',
    },
    {
      title: '状态',
      dataIndex: 'cluster_status',
      key: 'cluster_status',
      render: (status: boolean) => (
        <Tag color={status ? 'success' : 'error'}>
          {status ? '正常' : '异常'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Cluster) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<CloudServerOutlined />}
            onClick={() => navigate(`/clusters/${record.ID}/nodes`)}
          >
            节点状态
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.ID)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="集群管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          创建集群
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={clusters}
        rowKey={(record) => record.ID.toString()}
        loading={loading}
        pagination={{
          total,
          current,
          pageSize,
          onChange: (page, size) => {
            setCurrent(page);
            setPageSize(size);
          },
        }}
      />

      <Modal
        title={editingCluster ? '编辑集群' : '创建集群'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="集群名称"
            rules={[{ required: true, message: '请输入集群名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="cn_name"
            label="中文名称"
            rules={[{ required: true, message: '请输入中文名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="cluster_type"
            label="集群类型"
            rules={[{ required: true, message: '请选择集群类型' }]}
          >
            <Select>
              <Option value="kubernetes">Kubernetes</Option>
              <Option value="openshift">OpenShift</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="cluster_version"
            label="集群版本"
            rules={[{ required: true, message: '请输入集群版本' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="cluster_region"
            label="区域"
            rules={[{ required: true, message: '请输入区域' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="cluster_api"
            label="API 地址"
            rules={[{ required: true, message: '请输入 API 地址' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="kube_config"
            label="KubeConfig"
            rules={[{ required: true, message: '请输入 KubeConfig' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ClusterList; 