import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Badge, Tabs } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { clusterService } from '../services/cluster';
import type { Cluster } from '../services/cluster';
import Workloads from './Workloads';
import ClusterNodes from './ClusterNodes';

const { TabPane } = Tabs;

const ClusterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cluster, setCluster] = useState<Cluster | null>(null);

  useEffect(() => {
    if (id) {
      fetchClusterDetail();
    }
  }, [id]);

  const fetchClusterDetail = async () => {
    try {
      setLoading(true);
      const response = await clusterService.getCluster(parseInt(id!));
      setCluster(response);
    } catch (error) {
      console.error('Error fetching cluster detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!cluster) {
    return null;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        title={
          <Space>
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/clusters')}>
              返回
            </Button>
            <span>集群详情</span>
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, padding: '24px', overflow: 'auto' }}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="集群名称">{cluster.name}</Descriptions.Item>
          <Descriptions.Item label="中文名称">{cluster.cn_name}</Descriptions.Item>
          <Descriptions.Item label="集群类型">{cluster.cluster_type}</Descriptions.Item>
          <Descriptions.Item label="集群版本">{cluster.cluster_version}</Descriptions.Item>
          <Descriptions.Item label="区域">{cluster.cluster_region}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Badge status={cluster.cluster_status ? 'success' : 'error'} text={cluster.cluster_status ? '正常' : '异常'} />
          </Descriptions.Item>
        </Descriptions>

        <Tabs defaultActiveKey="workloads" style={{ marginTop: '24px' }}>
          <TabPane tab="工作负载" key="workloads">
            <Workloads />
          </TabPane>
          <TabPane tab="节点" key="nodes">
            <ClusterNodes />
          </TabPane>
          <TabPane tab="配置" key="config">
            <Card>
              <pre>{JSON.stringify(cluster, null, 2)}</pre>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ClusterDetail; 