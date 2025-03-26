import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, Select, message, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloudServerOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { clusterService, Cluster } from '../services/cluster';
import type { MenuProps } from 'antd';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const getActionItems = (record: Cluster): MenuProps['items'] => [
    {
      key: 'nodes',
      icon: <CloudServerOutlined />,
      label: '节点状态',
      onClick: () => navigate(`/clusters/${record.ID}/nodes`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => handleEdit(record),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => handleDelete(record.ID),
    },
  ];

  const getColumns = () => {
    const baseColumns = [
      {
        title: '操作',
        key: 'action',
        render: (_: unknown, record: Cluster) => (
          <Space size="middle">
            <Dropdown menu={{ items: getActionItems(record) }} placement="bottomRight">
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
      },
      {
        title: '集群名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
      },
    ];

    if (!isMobile) {
      return [
        ...baseColumns,
        {
          title: '中文名称',
          dataIndex: 'cn_name',
          key: 'cn_name',
          ellipsis: true,
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
      ];
    }

    return baseColumns;
  };

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
        columns={getColumns()}
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
          responsive: true,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editingCluster ? '编辑集群' : '创建集群'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '90%' : 600}
        style={{ top: isMobile ? 20 : 100 }}
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