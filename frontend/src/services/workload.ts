import { request } from '../utils/request';

export interface WorkloadBase {
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: any;
  status: any;
}

export interface Deployment extends WorkloadBase {
  kind: 'Deployment';
  spec: {
    replicas: number;
    selector: {
      matchLabels: Record<string, string>;
    };
    template: {
      metadata: {
        labels: Record<string, string>;
      };
      spec: {
        containers: Array<{
          name: string;
          image: string;
          ports?: Array<{
            containerPort: number;
            protocol: string;
          }>;
        }>;
      };
    };
  };
  status: {
    replicas: number;
    availableReplicas: number;
    updatedReplicas: number;
    conditions: Array<{
      type: string;
      status: string;
      message?: string;
    }>;
  };
}

export interface StatefulSet extends WorkloadBase {
  kind: 'StatefulSet';
  spec: {
    replicas: number;
    serviceName: string;
    selector: {
      matchLabels: Record<string, string>;
    };
    template: {
      metadata: {
        labels: Record<string, string>;
      };
      spec: {
        containers: Array<{
          name: string;
          image: string;
          ports?: Array<{
            containerPort: number;
            protocol: string;
          }>;
        }>;
      };
    };
  };
  status: {
    replicas: number;
    currentReplicas: number;
    readyReplicas: number;
    conditions: Array<{
      type: string;
      status: string;
      message?: string;
    }>;
  };
}

export interface DaemonSet extends WorkloadBase {
  kind: 'DaemonSet';
  spec: {
    selector: {
      matchLabels: Record<string, string>;
    };
    template: {
      metadata: {
        labels: Record<string, string>;
      };
      spec: {
        containers: Array<{
          name: string;
          image: string;
          ports?: Array<{
            containerPort: number;
            protocol: string;
          }>;
        }>;
      };
    };
  };
  status: {
    currentNumberScheduled: number;
    desiredNumberScheduled: number;
    numberReady: number;
    conditions: Array<{
      type: string;
      status: string;
      message?: string;
    }>;
  };
}

export type Workload = Deployment | StatefulSet | DaemonSet;

export interface WorkloadList {
  deployments: Deployment[];
  statefulSets: StatefulSet[];
  daemonSets: DaemonSet[];
}

export const workloadService = {
  // 获取集群的工作负载列表
  getWorkloads: async (clusterId: number, namespace?: string) => {
    const params = namespace ? { namespace } : {};
    return request.get<WorkloadList>(`/api/v1/clusters/${clusterId}/workloads`, { params });
  },

  // 获取特定工作负载详情
  getWorkload: async (clusterId: number, kind: string, name: string, namespace: string) => {
    return request.get<Workload>(`/api/v1/clusters/${clusterId}/workloads/${kind}/${namespace}/${name}`);
  },

  // 创建部署
  createDeployment: async (clusterId: number, namespace: string, data: Partial<Deployment>) => {
    return request.post<Deployment>(`/api/v1/clusters/${clusterId}/workloads/deployments/${namespace}`, data);
  },

  // 创建StatefulSet
  createStatefulSet: async (clusterId: number, namespace: string, data: Partial<StatefulSet>) => {
    return request.post<StatefulSet>(`/api/v1/clusters/${clusterId}/workloads/statefulsets/${namespace}`, data);
  },

  // 创建DaemonSet
  createDaemonSet: async (clusterId: number, namespace: string, data: Partial<DaemonSet>) => {
    return request.post<DaemonSet>(`/api/v1/clusters/${clusterId}/workloads/daemonsets/${namespace}`, data);
  },

  // 更新工作负载
  updateWorkload: async (clusterId: number, kind: string, namespace: string, name: string, data: Partial<Workload>) => {
    return request.put<Workload>(`/api/v1/clusters/${clusterId}/workloads/${kind}/${namespace}/${name}`, data);
  },

  // 删除工作负载
  deleteWorkload: async (clusterId: number, kind: string, namespace: string, name: string) => {
    return request.delete(`/api/v1/clusters/${clusterId}/workloads/${kind}/${namespace}/${name}`);
  },

  // 扩缩容
  scaleWorkload: async (clusterId: number, kind: string, namespace: string, name: string, replicas: number) => {
    return request.put(`/api/v1/clusters/${clusterId}/workloads/${kind}/${namespace}/${name}/scale`, { replicas });
  },
}; 