import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Tag, Descriptions, message } from 'antd';
import { clusterService, NodeInfo, Cluster } from '../services/cluster';

const ClusterNodes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [clusterInfo, setClusterInfo] = useState<Cluster | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [nodesResponse, clusterResponse] = await Promise.all([
        clusterService.getClusterNodes(parseInt(id)),
        clusterService.getCluster(parseInt(id))
      ]);
      
      // 确保 nodesResponse 是数组
      const nodesData = Array.isArray(nodesResponse) ? nodesResponse : [];
      console.log('Nodes Response:', nodesResponse);
      console.log('Processed Nodes:', nodesData);
      
      setNodes(nodesData);
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

  const columns = [
    {
      title: '节点名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      key: 'role',
      render: (record: NodeInfo) => {
        const isWorker = record.labels['node-role.kubernetes.io/WorkerNode'] === 'true';
        const isEtcd = record.labels['node-role.kubernetes.io/etcd'] === 'true';
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
      dataIndex: 'status',
      key: 'status',
      render: (status: { ready: boolean; conditions: Array<{ type: string; status: string; message: string }> }) => {
        const readyCondition = status.conditions.find(c => c.type === 'Ready');
        const isReady = readyCondition?.status === 'True';
        return (
          <Tag color={isReady ? 'success' : 'error'}>
            {isReady ? 'Ready' : readyCondition?.message || 'Not Ready'}
          </Tag>
        );
      },
    },
    {
      title: 'CPU 容量',
      dataIndex: 'capacity',
      key: 'cpu_capacity',
      render: (capacity: Record<string, string>) => capacity['cpu'] || 'N/A',
    },
    {
      title: '内存容量',
      dataIndex: 'capacity',
      key: 'memory_capacity',
      render: (capacity: Record<string, string>) => capacity['memory'] || 'N/A',
    },
    {
      title: '可分配 CPU',
      dataIndex: 'allocatable',
      key: 'cpu_allocatable',
      render: (allocatable: Record<string, string>) => allocatable['cpu'] || 'N/A',
    },
    {
      title: '可分配内存',
      dataIndex: 'allocatable',
      key: 'memory_allocatable',
      render: (allocatable: Record<string, string>) => allocatable['memory'] || 'N/A',
    },
    {
      title: 'Pod 容量',
      dataIndex: 'capacity',
      key: 'pods_capacity',
      render: (capacity: Record<string, string>) => capacity['pods'] || 'N/A',
    },
    {
      title: '可分配 Pod',
      dataIndex: 'allocatable',
      key: 'pods_allocatable',
      render: (allocatable: Record<string, string>) => allocatable['pods'] || 'N/A',
    },
    {
      title: '节点类型',
      key: 'type',
      render: (record: NodeInfo) => {
        const type = record.labels['type'] || 'N/A';
        return <Tag color="orange">{type}</Tag>;
      },
    },
    {
      title: '区域',
      key: 'zone',
      render: (record: NodeInfo) => {
        const zone = record.labels['topology.kubernetes.io/zone'] || 'N/A';
        return <Tag color="cyan">{zone}</Tag>;
      },
    },
  ];

  return (
    <div>
      {clusterInfo && (
        <Card title="集群信息" style={{ marginBottom: 16 }}>
          <Descriptions column={3}>
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
          rowKey="name"
          loading={loading}
          pagination={false}
          locale={{ emptyText: '暂无节点数据' }}
        />
      </Card>
    </div>
  );
};

export default ClusterNodes; 