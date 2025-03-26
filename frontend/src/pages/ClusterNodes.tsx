import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Tag, Descriptions, message, Button, Modal, Form, Input, Select, Space, Drawer, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, TagsOutlined, WarningOutlined } from '@ant-design/icons';
import { clusterService, NodeInfo, Cluster } from '../services/cluster';

const { Option } = Select;
const { Text } = Typography;

const ClusterNodes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [clusterInfo, setClusterInfo] = useState<Cluster | null>(null);
  const [labelModalVisible, setLabelModalVisible] = useState(false);
  const [taintModalVisible, setTaintModalVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);
  const [labelForm] = Form.useForm();
  const [taintForm] = Form.useForm();
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailType, setDetailType] = useState<'labels' | 'taints'>('labels');

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [nodesResponse, clusterResponse] = await Promise.all([
        clusterService.getClusterNodes(parseInt(id)),
        clusterService.getCluster(parseInt(id))
      ]);
      
      console.log('Nodes Response:', nodesResponse);
      setNodes(nodesResponse);
      setClusterInfo(clusterResponse);
    } catch (error) {
      message.error('获取节点信息失败');
      console.error('Error fetching cluster data:', error);
      setNodes([]);
      setClusterInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddLabel = async (values: { key: string; value: string }) => {
    if (!id || !selectedNode) return;
    try {
      await clusterService.updateNodeLabels(parseInt(id), selectedNode.metadata.name, {
        ...selectedNode.metadata.labels,
        [values.key]: values.value
      });
      message.success('标签添加成功');
      setLabelModalVisible(false);
      labelForm.resetFields();
      fetchData();
    } catch {
      message.error('标签添加失败');
    }
  };

  const handleDeleteLabel = async (nodeName: string, labelKey: string) => {
    if (!id) return;
    try {
      await clusterService.deleteNodeLabel(parseInt(id), nodeName, labelKey);
      message.success('标签删除成功');
      fetchData();
    } catch {
      message.error('标签删除失败');
    }
  };

  const handleAddTaint = async (values: { key: string; value: string; effect: string }) => {
    if (!id || !selectedNode) return;
    try {
      const newTaint = {
        key: values.key,
        value: values.value,
        effect: values.effect as 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute'
      };
      const currentTaints = selectedNode.spec.taints || [];
      await clusterService.updateNodeTaints(parseInt(id), selectedNode.metadata.name, [...currentTaints, newTaint]);
      message.success('污点添加成功');
      setTaintModalVisible(false);
      taintForm.resetFields();
      fetchData();
    } catch {
      message.error('污点添加失败');
    }
  };

  const handleDeleteTaint = async (nodeName: string, taintKey: string) => {
    if (!id) return;
    try {
      await clusterService.deleteNodeTaint(parseInt(id), nodeName, taintKey);
      message.success('污点删除成功');
      fetchData();
    } catch {
      message.error('污点删除失败');
    }
  };

  const handleShowDetails = (node: NodeInfo, type: 'labels' | 'taints') => {
    setSelectedNode(node);
    setDetailType(type);
    setDetailDrawerVisible(true);
  };

  const columns = [
    {
      title: '节点名称',
      dataIndex: ['metadata', 'name'],
      key: 'name',
      fixed: 'left' as const,
      width: 150,
    },
    {
      title: '角色',
      key: 'role',
      width: 100,
      render: (record: NodeInfo) => {
        const isWorker = record.metadata.labels['node-role.kubernetes.io/WorkerNode'] === 'true';
        const isEtcd = record.metadata.labels['node-role.kubernetes.io/etcd'] === 'true';
        let role = 'Worker';
        let color = 'blue';
        
        if (isEtcd) {
          role = 'Etcd';
          color = 'purple';
        } else if (isWorker) {
          role = 'Worker';
          color = 'blue';
        } else {
          role = 'Master';
          color = 'red';
        }
        
        return (
          <Tag color={color}>
            {role}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (record: NodeInfo) => {
        const readyCondition = record.status.conditions.find(c => c.type === 'Ready');
        const isReady = readyCondition?.status === 'True';
        return (
          <Tag color={isReady ? 'success' : 'error'}>
            {isReady ? 'Ready' : readyCondition?.message || 'Not Ready'}
          </Tag>
        );
      },
    },
    {
      title: '资源信息',
      key: 'resources',
      width: 200,
      render: (record: NodeInfo) => (
        <Space direction="vertical" size="small">
          <Text>CPU: {record.status.capacity.cpu}</Text>
          <Text>内存: {record.status.capacity.memory}</Text>
          <Text>Pod: {record.status.capacity.pods}</Text>
        </Space>
      ),
    },
    {
      title: '系统信息',
      key: 'system',
      width: 200,
      render: (record: NodeInfo) => (
        <Space direction="vertical" size="small">
          <Text>OS: {record.status.nodeInfo.osImage}</Text>
          <Text>K8s: {record.status.nodeInfo.kubeletVersion}</Text>
          <Text>运行时: {record.status.nodeInfo.containerRuntimeVersion}</Text>
        </Space>
      ),
    },
    {
      title: '标签',
      key: 'labels',
      width: 120,
      render: (record: NodeInfo) => (
        <Button
          type="primary"
          icon={<TagsOutlined />}
          onClick={() => handleShowDetails(record, 'labels')}
        >
          标签 ({Object.keys(record.metadata.labels).length})
        </Button>
      ),
    },
    {
      title: '污点',
      key: 'taints',
      width: 120,
      render: (record: NodeInfo) => (
        <Button
          type="primary"
          danger
          icon={<WarningOutlined />}
          onClick={() => handleShowDetails(record, 'taints')}
        >
          污点 ({record.spec.taints?.length || 0})
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {clusterInfo && (
        <Card title="集群信息" style={{ marginBottom: 16 }}>
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
            <Descriptions.Item label="集群名称">{clusterInfo.name}</Descriptions.Item>
            <Descriptions.Item label="中文名称">{clusterInfo.cn_name}</Descriptions.Item>
            <Descriptions.Item label="集群类型">{clusterInfo.cluster_type}</Descriptions.Item>
            <Descriptions.Item label="集群版本">{clusterInfo.cluster_version}</Descriptions.Item>
            <Descriptions.Item label="区域">{clusterInfo.cluster_region}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={clusterInfo.cluster_status ? 'success' : 'error'}>
                {clusterInfo.cluster_status ? '正常' : '异常'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="节点列表">
        <Table
          columns={columns}
          dataSource={nodes}
          rowKey={(record) => record.metadata.name}
          loading={loading}
          pagination={false}
          scroll={{ x: 1100 }}
          locale={{ emptyText: '暂无节点数据' }}
        />
      </Card>

      {/* 标签详情抽屉 */}
      <Drawer
        title="节点标签详情"
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible && detailType === 'labels'}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setLabelModalVisible(true);
              setDetailDrawerVisible(false);
            }}
          >
            添加标签
          </Button>
        }
      >
        {selectedNode && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {Object.entries(selectedNode.metadata.labels).map(([key, value]) => (
              <Card key={key} size="small">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Tag color="blue">{key}</Tag>
                    <Text>{value}</Text>
                  </Space>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteLabel(selectedNode.metadata.name, key)}
                  >
                    删除
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Drawer>

      {/* 污点详情抽屉 */}
      <Drawer
        title="节点污点详情"
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible && detailType === 'taints'}
        extra={
          <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            onClick={() => {
              setTaintModalVisible(true);
              setDetailDrawerVisible(false);
            }}
          >
            添加污点
          </Button>
        }
      >
        {selectedNode && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {selectedNode.spec.taints?.map((taint, index) => (
              <Card key={index} size="small">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Tag color="red">{taint.key}={taint.value}</Tag>
                    <Text type="danger">{taint.effect}</Text>
                  </Space>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteTaint(selectedNode.metadata.name, taint.key)}
                  >
                    删除
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Drawer>

      {/* 添加标签弹窗 */}
      <Modal
        title="添加标签"
        open={labelModalVisible}
        onCancel={() => {
          setLabelModalVisible(false);
          if (detailType === 'labels') {
            setDetailDrawerVisible(true);
          }
        }}
        footer={null}
      >
        <Form form={labelForm} onFinish={handleAddLabel}>
          <Form.Item
            name="key"
            label="标签键"
            rules={[{ required: true, message: '请输入标签键' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="value"
            label="标签值"
            rules={[{ required: true, message: '请输入标签值' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              添加
            </Button>
            <Button onClick={() => {
              setLabelModalVisible(false);
              if (detailType === 'labels') {
                setDetailDrawerVisible(true);
              }
            }} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加污点弹窗 */}
      <Modal
        title="添加污点"
        open={taintModalVisible}
        onCancel={() => {
          setTaintModalVisible(false);
          if (detailType === 'taints') {
            setDetailDrawerVisible(true);
          }
        }}
        footer={null}
      >
        <Form form={taintForm} onFinish={handleAddTaint}>
          <Form.Item
            name="key"
            label="污点键"
            rules={[{ required: true, message: '请输入污点键' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="value"
            label="污点值"
            rules={[{ required: true, message: '请输入污点值' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="effect"
            label="效果"
            rules={[{ required: true, message: '请选择效果' }]}
          >
            <Select>
              <Option value="NoSchedule">NoSchedule</Option>
              <Option value="PreferNoSchedule">PreferNoSchedule</Option>
              <Option value="NoExecute">NoExecute</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              添加
            </Button>
            <Button onClick={() => {
              setTaintModalVisible(false);
              if (detailType === 'taints') {
                setDetailDrawerVisible(true);
              }
            }} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClusterNodes; 