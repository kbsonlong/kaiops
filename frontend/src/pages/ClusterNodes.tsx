import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Tag, Descriptions, message, Button, Modal, Form, Input, Select, Space, Drawer, Typography, Dropdown, Badge, Tooltip, Progress } from 'antd';
import { PlusOutlined, DeleteOutlined, TagsOutlined, WarningOutlined, MoreOutlined, InfoCircleOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { clusterService, NodeInfo, Cluster } from '../services/cluster';
import type { MenuProps } from 'antd';
import type { SizeType } from 'antd/es/config-provider/SizeContext';

const { Option } = Select;
const { Text, Title } = Typography;

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
  const [detailType, setDetailType] = useState<'labels' | 'taints' | 'info'>('labels');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchText, setSearchText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      timer = setInterval(fetchData, 30000); // 30秒自动刷新
    }
    return () => clearInterval(timer);
  }, [autoRefresh, id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [nodesResponse, clusterResponse] = await Promise.all([
        clusterService.getClusterNodes(parseInt(id)),
        clusterService.getCluster(parseInt(id))
      ]);
      
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

  const handleShowDetails = (node: NodeInfo, type: 'labels' | 'taints' | 'info') => {
    setSelectedNode(node);
    setDetailType(type);
    setDetailDrawerVisible(true);
  };

  const getActionItems = (record: NodeInfo): MenuProps['items'] => [
    {
      key: 'info',
      icon: <InfoCircleOutlined />,
      label: '节点详情',
      onClick: () => handleShowDetails(record, 'info'),
    },
    {
      key: 'labels',
      icon: <TagsOutlined />,
      label: '标签管理',
      onClick: () => handleShowDetails(record, 'labels'),
    },
    {
      key: 'taints',
      icon: <WarningOutlined />,
      label: '污点管理',
      onClick: () => handleShowDetails(record, 'taints'),
    },
  ];

  const getColumns = () => {
    const baseColumns = [
      {
        title: '操作',
        key: 'action',
        fixed: 'left' as const,
        width: isMobile ? 60 : 80,
        render: (_: unknown, record: NodeInfo) => (
          <Dropdown menu={{ items: getActionItems(record) }} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
      {
        title: '节点名称',
        dataIndex: ['metadata', 'name'],
        key: 'name',
        fixed: 'left' as const,
        width: isMobile ? 120 : 150,
        ellipsis: true,
        render: (text: string, record: NodeInfo) => (
          <Tooltip title={text}>
            <Text>{text}</Text>
          </Tooltip>
        ),
      },
      {
        title: '角色',
        key: 'role',
        width: isMobile ? 80 : 100,
        render: (_: unknown, record: NodeInfo) => {
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
            <Tag color={color} style={{ margin: 0 }}>
              {role}
            </Tag>
          );
        },
      },
      {
        title: '状态',
        key: 'status',
        width: isMobile ? 80 : 100,
        render: (_: unknown, record: NodeInfo) => {
          const readyCondition = record.status.conditions.find(c => c.type === 'Ready');
          const isReady = readyCondition?.status === 'True';
          return (
            <Tag color={isReady ? 'success' : 'error'} style={{ margin: 0 }}>
              {isReady ? 'Ready' : readyCondition?.message || 'Not Ready'}
            </Tag>
          );
        },
      },
    ];

    if (!isMobile) {
      return [
        ...baseColumns,
        {
          title: '资源信息',
          key: 'resources',
          width: 200,
          render: (record: NodeInfo) => (
            <Space direction="vertical" size="small">
              <Progress 
                percent={Math.round(parseInt(record.status.allocatable.cpu) / parseInt(record.status.capacity.cpu) * 100)} 
                size="small" 
                status="active"
                format={(percent) => `CPU: ${record.status.allocatable.cpu}/${record.status.capacity.cpu} (${percent}%)`}
              />
              <Progress 
                percent={Math.round(parseInt(record.status.allocatable.memory) / parseInt(record.status.capacity.memory) * 100)} 
                size="small" 
                status="active"
                format={(percent) => `内存: ${record.status.allocatable.memory}/${record.status.capacity.memory} (${percent}%)`}
              />
              <Text>Pod: {record.status.allocatable.pods}/{record.status.capacity.pods}</Text>
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
      ];
    }

    return baseColumns;
  };

  const filteredNodes = nodes.filter(node => 
    node.metadata.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: isMobile ? '12px' : '24px' }}>
      {clusterInfo && (
        <Card title="集群信息" style={{ marginBottom: 16 }}>
          <Descriptions 
            column={{ xs: 1, sm: 2, md: 3 }} 
            bordered
            size={isMobile ? 'small' : 'default'}
          >
            <Descriptions.Item label="集群名称">{clusterInfo.name}</Descriptions.Item>
            <Descriptions.Item label="中文名称">{clusterInfo.cn_name}</Descriptions.Item>
            <Descriptions.Item label="集群类型">{clusterInfo.cluster_type}</Descriptions.Item>
            <Descriptions.Item label="集群版本">{clusterInfo.cluster_version}</Descriptions.Item>
            <Descriptions.Item label="区域">{clusterInfo.cluster_region}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={clusterInfo.cluster_status ? 'success' : 'error'} text={clusterInfo.cluster_status ? '正常' : '异常'} />
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>节点列表</Title>
            <Space>
              <Input
                placeholder="搜索节点"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchData}
                loading={loading}
              />
              <Button 
                type={autoRefresh ? 'primary' : 'default'}
                onClick={() => setAutoRefresh(!autoRefresh)}
                icon={<ReloadOutlined spin={autoRefresh} />}
              >
                {autoRefresh ? '自动刷新中' : '开启自动刷新'}
              </Button>
            </Space>
          </Space>
        }
      >
        <Table
          columns={getColumns()}
          dataSource={filteredNodes}
          rowKey={(record) => record.metadata.name}
          loading={loading}
          pagination={false}
          scroll={{ x: isMobile ? 500 : 1100 }}
          locale={{ emptyText: '暂无节点数据' }}
          size={isMobile ? 'small' as SizeType : 'middle' as SizeType}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              {selectedNode?.metadata.name}
            </Title>
            <Text type="secondary">
              {detailType === 'labels' ? '标签管理' : 
               detailType === 'taints' ? '污点管理' : '节点详情'}
            </Text>
          </Space>
        }
        placement={isMobile ? 'bottom' : 'right'}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={isMobile ? '100%' : 600}
        height={isMobile ? '80%' : undefined}
      >
        {selectedNode && (
          <div>
            {detailType === 'info' ? (
              <Descriptions column={1} bordered>
                <Descriptions.Item label="节点名称">{selectedNode.metadata.name}</Descriptions.Item>
                <Descriptions.Item label="角色">
                  {Object.entries(selectedNode.metadata.labels)
                    .filter(([key]) => key.startsWith('node-role.kubernetes.io/'))
                    .map(([key, value]) => (
                      <Tag key={key} color="blue">{key.replace('node-role.kubernetes.io/', '')}</Tag>
                    ))}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {selectedNode.status.conditions.map(condition => (
                    <Tag key={condition.type} color={condition.status === 'True' ? 'success' : 'error'}>
                      {condition.type}: {condition.status}
                    </Tag>
                  ))}
                </Descriptions.Item>
                <Descriptions.Item label="资源信息">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Progress 
                      percent={Math.round(parseInt(selectedNode.status.allocatable.cpu) / parseInt(selectedNode.status.capacity.cpu) * 100)} 
                      size="small" 
                      status="active"
                      format={(percent) => `CPU: ${selectedNode.status.allocatable.cpu}/${selectedNode.status.capacity.cpu} (${percent}%)`}
                    />
                    <Progress 
                      percent={Math.round(parseInt(selectedNode.status.allocatable.memory) / parseInt(selectedNode.status.capacity.memory) * 100)} 
                      size="small" 
                      status="active"
                      format={(percent) => `内存: ${selectedNode.status.allocatable.memory}/${selectedNode.status.capacity.memory} (${percent}%)`}
                    />
                    <Text>Pod: {selectedNode.status.allocatable.pods}/{selectedNode.status.capacity.pods}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="系统信息">
                  <Space direction="vertical">
                    <Text>OS: {selectedNode.status.nodeInfo.osImage}</Text>
                    <Text>K8s: {selectedNode.status.nodeInfo.kubeletVersion}</Text>
                    <Text>运行时: {selectedNode.status.nodeInfo.containerRuntimeVersion}</Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            ) : detailType === 'labels' ? (
              <div>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {Object.entries(selectedNode.metadata.labels).map(([key, value]) => (
                    <Card key={key} size="small">
                      <Space>
                        <Tag>{key}: {value}</Tag>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteLabel(selectedNode.metadata.name, key)}
                        />
                      </Space>
                    </Card>
                  ))}
                </Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setLabelModalVisible(true);
                    labelForm.resetFields();
                  }}
                  style={{ marginTop: 16 }}
                >
                  添加标签
                </Button>
              </div>
            ) : (
              <div>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedNode.spec.taints?.map((taint, index) => (
                    <Card key={index} size="small">
                      <Space>
                        <Tag color="red">
                          {taint.key}: {taint.value} ({taint.effect})
                        </Tag>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteTaint(selectedNode.metadata.name, taint.key)}
                        />
                      </Space>
                    </Card>
                  ))}
                </Space>
                <Button
                  type="primary"
                  danger
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setTaintModalVisible(true);
                    taintForm.resetFields();
                  }}
                  style={{ marginTop: 16 }}
                >
                  添加污点
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 标签添加模态框 */}
      <Modal
        title="添加标签"
        open={labelModalVisible}
        onOk={() => labelForm.submit()}
        onCancel={() => setLabelModalVisible(false)}
        width={isMobile ? '90%' : 500}
        style={{ top: isMobile ? 20 : 100 }}
      >
        <Form form={labelForm} onFinish={handleAddLabel} layout="vertical">
          <Form.Item
            name="key"
            label="标签键"
            rules={[{ required: true, message: '请输入标签键' }]}
            tooltip="标签的键名"
          >
            <Input placeholder="请输入标签键" />
          </Form.Item>
          <Form.Item
            name="value"
            label="标签值"
            rules={[{ required: true, message: '请输入标签值' }]}
            tooltip="标签的值"
          >
            <Input placeholder="请输入标签值" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 污点添加模态框 */}
      <Modal
        title="添加污点"
        open={taintModalVisible}
        onOk={() => taintForm.submit()}
        onCancel={() => setTaintModalVisible(false)}
        width={isMobile ? '90%' : 500}
        style={{ top: isMobile ? 20 : 100 }}
      >
        <Form form={taintForm} onFinish={handleAddTaint} layout="vertical">
          <Form.Item
            name="key"
            label="污点键"
            rules={[{ required: true, message: '请输入污点键' }]}
            tooltip="污点的键名"
          >
            <Input placeholder="请输入污点键" />
          </Form.Item>
          <Form.Item
            name="value"
            label="污点值"
            rules={[{ required: true, message: '请输入污点值' }]}
            tooltip="污点的值"
          >
            <Input placeholder="请输入污点值" />
          </Form.Item>
          <Form.Item
            name="effect"
            label="效果"
            rules={[{ required: true, message: '请选择效果' }]}
            tooltip="污点对Pod调度的影响"
          >
            <Select>
              <Option value="NoSchedule">NoSchedule - 不调度</Option>
              <Option value="PreferNoSchedule">PreferNoSchedule - 尽量避免调度</Option>
              <Option value="NoExecute">NoExecute - 驱逐已运行的Pod</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClusterNodes; 