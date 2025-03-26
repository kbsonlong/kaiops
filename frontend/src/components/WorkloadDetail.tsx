import React from 'react';
import { Card, Descriptions, Table, Tag, Space, Badge, Divider } from 'antd';
import type { Workload, Deployment, StatefulSet, DaemonSet } from '../services/workload';
import type { SizeType } from 'antd/es/config-provider/SizeContext';

interface WorkloadDetailProps {
  workload: Workload;
  isMobile?: boolean;
}

const WorkloadDetail: React.FC<WorkloadDetailProps> = ({ workload, isMobile = false }) => {
  const getStatusInfo = () => {
    switch (workload.kind.toLowerCase()) {
      case 'deployment':
        const deployment = workload as Deployment;
        const isAvailable = deployment.status.conditions?.some(
          c => c.type === 'Available' && c.status === 'True'
        );
        return {
          status: isAvailable ? 'success' as const : 'error' as const,
          text: isAvailable ? 'Available' : 'Not Available',
          replicas: `${deployment.status.availableReplicas || 0}/${deployment.spec.replicas}`,
        };
      case 'statefulset':
        const sts = workload as StatefulSet;
        const isReady = sts.status.readyReplicas === sts.spec.replicas;
        return {
          status: isReady ? 'success' as const : 'error' as const,
          text: isReady ? 'Ready' : 'Not Ready',
          replicas: `${sts.status.readyReplicas || 0}/${sts.spec.replicas}`,
        };
      case 'daemonset':
        const ds = workload as DaemonSet;
        const dsReady = ds.status.numberReady === ds.status.desiredNumberScheduled;
        return {
          status: dsReady ? 'success' as const : 'error' as const,
          text: dsReady ? 'Ready' : 'Not Ready',
          replicas: `${ds.status.numberReady || 0}/${ds.status.desiredNumberScheduled}`,
        };
      default:
        return {
          status: 'default' as const,
          text: 'Unknown',
          replicas: '0/0',
        };
    }
  };

  const statusInfo = getStatusInfo();

  const containerColumns = [
    {
      title: '容器名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '镜像',
      dataIndex: 'image',
      key: 'image',
    },
    {
      title: '端口',
      key: 'ports',
      render: (record: any) => (
        <Space>
          {record.ports?.map((port: any) => (
            <Tag key={`${port.containerPort}-${port.protocol}`}>
              {port.containerPort}/{port.protocol}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  const labelColumns = [
    {
      title: '键',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
    },
  ];

  return (
    <div>
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions
          column={{ xs: 1, sm: 2, md: 3 }}
          bordered
          size={isMobile ? 'small' : 'middle'}
        >
          <Descriptions.Item label="名称">{workload.metadata.name}</Descriptions.Item>
          <Descriptions.Item label="命名空间">{workload.metadata.namespace}</Descriptions.Item>
          <Descriptions.Item label="类型">{workload.kind}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Badge status={statusInfo.status} text={statusInfo.text} />
          </Descriptions.Item>
          <Descriptions.Item label="副本数">{statusInfo.replicas}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date().toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="容器配置" style={{ marginBottom: 16 }}>
        <Table
          columns={containerColumns}
          dataSource={workload.spec.template.spec.containers}
          rowKey="name"
          pagination={false}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>

      <Card title="标签" style={{ marginBottom: 16 }}>
        <Table
          columns={labelColumns}
          dataSource={Object.entries(workload.metadata.labels || {}).map(([key, value]) => ({
            key,
            value,
          }))}
          rowKey="key"
          pagination={false}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>

      {workload.kind.toLowerCase() === 'deployment' && (
        <Card title="部署状态" style={{ marginBottom: 16 }}>
          <Descriptions
            column={{ xs: 1, sm: 2, md: 3 }}
            bordered
            size={isMobile ? 'small' : 'middle'}
          >
            <Descriptions.Item label="可用副本数">
              {(workload as Deployment).status.availableReplicas || 0}
            </Descriptions.Item>
            <Descriptions.Item label="更新副本数">
              {(workload as Deployment).status.updatedReplicas || 0}
            </Descriptions.Item>
            <Descriptions.Item label="期望副本数">
              {(workload as Deployment).spec.replicas}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {workload.kind.toLowerCase() === 'statefulset' && (
        <Card title="状态集状态" style={{ marginBottom: 16 }}>
          <Descriptions
            column={{ xs: 1, sm: 2, md: 3 }}
            bordered
            size={isMobile ? 'small' : 'middle'}
          >
            <Descriptions.Item label="就绪副本数">
              {(workload as StatefulSet).status.readyReplicas || 0}
            </Descriptions.Item>
            <Descriptions.Item label="当前副本数">
              {(workload as StatefulSet).status.currentReplicas || 0}
            </Descriptions.Item>
            <Descriptions.Item label="期望副本数">
              {(workload as StatefulSet).spec.replicas}
            </Descriptions.Item>
            <Descriptions.Item label="服务名称">
              {(workload as StatefulSet).spec.serviceName}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {workload.kind.toLowerCase() === 'daemonset' && (
        <Card title="守护进程集状态" style={{ marginBottom: 16 }}>
          <Descriptions
            column={{ xs: 1, sm: 2, md: 3 }}
            bordered
            size={isMobile ? 'small' : 'middle'}
          >
            <Descriptions.Item label="就绪副本数">
              {(workload as DaemonSet).status.numberReady || 0}
            </Descriptions.Item>
            <Descriptions.Item label="期望副本数">
              {(workload as DaemonSet).status.desiredNumberScheduled}
            </Descriptions.Item>
            <Descriptions.Item label="当前调度数">
              {(workload as DaemonSet).status.currentNumberScheduled || 0}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default WorkloadDetail; 