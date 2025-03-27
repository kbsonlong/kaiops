import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Tabs, Tag, Space, Button, Modal, message, Typography, Input, Select, Tooltip, Badge, Dropdown, Descriptions, Menu, Drawer } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, SearchOutlined, InfoCircleOutlined, MoreOutlined, EyeOutlined } from '@ant-design/icons';
import { workloadService, Workload, WorkloadList, Deployment, StatefulSet, DaemonSet } from '../services/workload';
import WorkloadForm from '../components/WorkloadForm';
import ScaleWorkloadModal from '../components/ScaleWorkloadModal';
import WorkloadDetail from '../components/WorkloadDetail';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import type { BadgeProps } from 'antd/es/badge';

const { TabPane } = Tabs;
const { Text } = Typography;

const Workloads: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [workloads, setWorkloads] = useState<WorkloadList>({
    deployments: [],
    statefulSets: [],
    daemonSets: [],
  });
  const [activeTab, setActiveTab] = useState('deployments');
  const [searchText, setSearchText] = useState('');
  const [selectedWorkload, setSelectedWorkload] = useState<Workload | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (id) {
      fetchWorkloads();
    }
  }, [id, pagination.current, pagination.pageSize, activeTab]);

  const fetchWorkloads = async () => {
    try {
      setLoading(true);

      // 直接构造查询字符串
      // const queryParams = `page=${pagination.current}&pageSize=${pagination.pageSize}&kind=${activeTab === 'deployments' ? 'Deployment' : 
      //   activeTab === 'statefulsets' ? 'StatefulSet' : 'DaemonSet'}`;
      const response = await workloadService.getWorkloads(
        parseInt(id!),
        {
          page: pagination.current,
          pageSize: pagination.pageSize,
          kind: activeTab === 'deployments' ? 'Deployment' : 
                activeTab === 'statefulsets' ? 'StatefulSet' : 'DaemonSet'
        }
      );
      setWorkloads(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.meta.total,
      }));
    } catch (error) {
      message.error('获取工作负载列表失败');
      console.error('Error fetching workloads:', error);
      setWorkloads({
        deployments: [],
        statefulSets: [],
        daemonSets: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedWorkload(null);
    setFormVisible(true);
  };

  const handleEdit = (record: Workload) => {
    setSelectedWorkload(record);
    setFormVisible(true);
  };

  const handleDelete = async (record: Workload) => {
    try {
      await workloadService.deleteWorkload(
        parseInt(id!),
        record.kind,
        record.metadata.namespace,
        record.metadata.name
      );
      message.success('删除成功');
      fetchWorkloads();
    } catch (error) {
      message.error('删除失败');
      console.error('Error deleting workload:', error);
    }
  };

  const handleScale = (record: Workload) => {
    setSelectedWorkload(record);
    setScaleModalVisible(true);
  };

  const handleViewDetail = (record: Workload) => {
    setSelectedWorkload(record);
    setDetailDrawerVisible(true);
  };

  const getActionItems = (record: Workload): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => handleEdit(record),
    },
    {
      key: 'scale',
      icon: <ReloadOutlined />,
      label: '扩缩容',
      onClick: () => handleScale(record),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => handleDelete(record),
    },
  ];

  const getColumns = (): ColumnsType<Workload> => {
    const baseColumns = [
      {
        title: '操作',
        key: 'action',
        fixed: 'left' as const,
        width: isMobile ? 60 : 80,
        render: (_: unknown, record: Workload) => (
          <Space size="middle">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
            <Dropdown menu={{ items: getActionItems(record) }} placement="bottomRight">
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
      },
      {
        title: '名称',
        dataIndex: ['metadata', 'name'],
        key: 'name',
        fixed: 'left' as const,
        width: isMobile ? 120 : 150,
        ellipsis: true,
      },
    ];

    if (!isMobile) {
      return [
        ...baseColumns,
        {
          title: '命名空间',
          dataIndex: ['metadata', 'namespace'],
          key: 'namespace',
        },
        {
          title: '副本数',
          dataIndex: ['spec', 'replicas'],
          key: 'replicas',
        },
        {
          title: '镜像',
          dataIndex: ['spec', 'template', 'spec', 'containers', 0, 'image'],
          key: 'image',
          ellipsis: true,
        },
        {
          title: '状态',
          key: 'status',
          render: (_, record) => {
            const status = getStatusInfo(record);
            return (
              <Space>
                <Badge status={status.color} />
                <Text>{status.text}</Text>
              </Space>
            );
          },
        },
      ];
    }

    return baseColumns;
  };

  const getStatusInfo = (workload: Workload): { color: BadgeProps['status']; text: string } => {
    switch (workload.kind) {
      case 'Deployment':
        const deployment = workload as Deployment;
        if (deployment.spec.replicas === 0) {
          return {
            color: 'default',
            text: '待部署',
          };
        }
        const available = deployment.status.availableReplicas === deployment.spec.replicas;
        return {
          color: available ? 'success' : 'warning',
          text: available ? '运行中' : '更新中',
        };
      case 'StatefulSet':
        const statefulSet = workload as StatefulSet;
        if (statefulSet.spec.replicas === 0) {
          return {
            color: 'default',
            text: '待部署',
          };
        }
        const ready = statefulSet.status.readyReplicas === statefulSet.spec.replicas;
        return {
          color: ready ? 'success' : 'warning',
          text: ready ? '运行中' : '更新中',
        };
      case 'DaemonSet':
        const daemonSet = workload as DaemonSet;
        if (daemonSet.status.desiredNumberScheduled === 0) {
          return {
            color: 'default',
            text: '待部署',
          };
        }
        const desired = daemonSet.status.desiredNumberScheduled === daemonSet.status.numberReady;
        return {
          color: desired ? 'success' : 'warning',
          text: desired ? '运行中' : '更新中',
        };
      default:
        return {
          color: 'default',
          text: '未知',
        };
    }
  };

  const filteredDeployments = (workloads?.deployments || []).filter(deployment =>
    deployment.metadata.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredStatefulSets = (workloads?.statefulSets || []).filter(statefulSet =>
    statefulSet.metadata.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredDaemonSets = (workloads?.daemonSets || []).filter(daemonSet =>
    daemonSet.metadata.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleTableChange = (pagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        title="工作负载管理"
        extra={
          <Space>
            <Input
              placeholder="搜索工作负载"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建工作负载
            </Button>
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, padding: '24px', overflow: 'auto' }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Deployments" key="deployments">
            <Table
              columns={getColumns()}
              dataSource={filteredDeployments}
              rowKey={(record) => `${record.kind}-${record.metadata.name}-${record.metadata.namespace}`}
              loading={loading}
              scroll={{ x: true }}
              size={isMobile ? 'small' : 'middle'}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              onChange={handleTableChange}
            />
          </TabPane>
          <TabPane tab="StatefulSets" key="statefulsets">
            <Table
              columns={getColumns()}
              dataSource={filteredStatefulSets}
              rowKey={(record) => `${record.kind}-${record.metadata.name}-${record.metadata.namespace}`}
              loading={loading}
              scroll={{ x: true }}
              size={isMobile ? 'small' : 'middle'}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              onChange={handleTableChange}
            />
          </TabPane>
          <TabPane tab="DaemonSets" key="daemonsets">
            <Table
              columns={getColumns()}
              dataSource={filteredDaemonSets}
              rowKey={(record) => `${record.kind}-${record.metadata.name}-${record.metadata.namespace}`}
              loading={loading}
              scroll={{ x: true }}
              size={isMobile ? 'small' : 'middle'}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              onChange={handleTableChange}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={selectedWorkload ? '编辑工作负载' : '创建工作负载'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={isMobile ? '90%' : 800}
        style={{ top: isMobile ? 20 : 100 }}
      >
        <WorkloadForm
          type={activeTab as 'deployment' | 'statefulset' | 'daemonset'}
          initialValues={selectedWorkload || undefined}
          onSubmit={async (values) => {
            try {
              if (selectedWorkload) {
                await workloadService.updateWorkload(
                  parseInt(id!),
                  selectedWorkload.kind,
                  selectedWorkload.metadata.namespace,
                  selectedWorkload.metadata.name,
                  values
                );
                message.success('更新成功');
              } else {
                switch (activeTab) {
                  case 'deployments':
                    await workloadService.createWorkLoad(parseInt(id!), 'deployments', 'default', values);
                    message.success('创建成功');
                    break;
                  case 'statefulsets':
                    await workloadService.createWorkLoad(parseInt(id!),'statefulsets', 'default', values);
                    message.success('创建成功');
                    break;
                  case 'daemonsets':
                    await workloadService.createWorkLoad(parseInt(id!),'daemonsets', 'default', values);
                    message.success('创建成功');
                    break;
                }
              }
              setFormVisible(false);
              fetchWorkloads();
            } catch (error) {
              message.error('操作失败');
              console.error('Error saving workload:', error);
            }
          }}
          onCancel={() => setFormVisible(false)}
          loading={loading}
        />
      </Modal>

      <ScaleWorkloadModal
        visible={scaleModalVisible}
        workload={selectedWorkload}
        onCancel={() => setScaleModalVisible(false)}
        onOk={async (replicas) => {
          try {
            if (selectedWorkload) {
              await workloadService.scaleWorkload(
                parseInt(id!),
                selectedWorkload.kind,
                selectedWorkload.metadata.namespace,
                selectedWorkload.metadata.name,
                replicas
              );
              message.success('扩缩容成功');
              setScaleModalVisible(false);
              fetchWorkloads();
            }
          } catch (error) {
            message.error('扩缩容失败');
            console.error('Error scaling workload:', error);
          }
        }}
      />

      <Drawer
        title="工作负载详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={isMobile ? '100%' : 600}
      >
        {selectedWorkload && <WorkloadDetail workload={selectedWorkload} />}
      </Drawer>
    </div>
  );
};

export default Workloads;