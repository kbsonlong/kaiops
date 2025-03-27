import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface Cluster {
  ID: number;
  name: string;
  cn_name: string;
  cluster_type: string;
  kube_config: string;
  cluster_api: string;
  cluster_status: boolean;
  cluster_version: string;
  cluster_region: string;
  cluster_zone: string[];
  cluster_network: {
    pod_cidr: string;
    svc_cidr: string;
  };
  cluster_subnet: string[];
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

export interface NodeInfo {
  metadata: {
    name: string;
    labels: {
      [key: string]: string;
    };
  };
  spec: {
    providerID: string;
    taints?: Array<{
      key: string;
      value: string;
      effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
    }>;
  };
  status: {
    capacity: {
      cpu: string;
      memory: string;
      pods: string;
      [key: string]: string;
    };
    allocatable: {
      cpu: string;
      memory: string;
      pods: string;
      [key: string]: string;
    };
    conditions: Array<{
      type: string;
      status: string;
      reason: string;
      message: string;
      lastHeartbeatTime: string;
      lastTransitionTime: string;
    }>;
    addresses: Array<{
      type: string;
      address: string;
    }>;
    nodeInfo: {
      architecture: string;
      bootID: string;
      containerRuntimeVersion: string;
      kernelVersion: string;
      kubeProxyVersion: string;
      kubeletVersion: string;
      machineID: string;
      operatingSystem: string;
      osImage: string;
      systemUUID: string;
    };
  };
}

interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    page_size: number;
  };
}

interface NodesResponse {
  nodes: {
    metadata: {
      resourceVersion: string;
    };
    items: NodeInfo[];
  };
}

export const clusterService = {
  // 获取集群列表
  getClusters: async (page: number = 1, pageSize: number = 10, filters?: { cluster_type?: string; region?: string }): Promise<ApiResponse<Cluster[]>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(filters?.cluster_type && { cluster_type: filters.cluster_type }),
      ...(filters?.region && { region: filters.region }),
    });
    const response = await axios.get(`${API_BASE_URL}/clusters?${params}`);
    return response.data;
  },

  // 获取单个集群
  getCluster: async (id: number): Promise<Cluster> => {
    const response = await axios.get(`${API_BASE_URL}/clusters/${id}`);
    return response.data;
  },

  // 创建集群
  createCluster: async (cluster: Omit<Cluster, 'ID'>): Promise<Cluster> => {
    const response = await axios.post(`${API_BASE_URL}/clusters`, cluster);
    return response.data;
  },

  // 更新集群
  updateCluster: async (id: number, cluster: Partial<Cluster>): Promise<Cluster> => {
    const response = await axios.put(`${API_BASE_URL}/clusters/${id}`, cluster);
    return response.data;
  },

  // 删除集群
  deleteCluster: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/clusters/${id}`);
  },

  // 获取集群节点状态
  getClusterNodes: async (clusterId: number): Promise<NodeInfo[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clusters/${clusterId}/nodes`);
      const nodesResponse: NodesResponse = response.data;
      return nodesResponse.nodes.items || [];
    } catch (error) {
      console.error('Error fetching cluster nodes:', error);
      throw error;
    }
  },

  // 更新节点标签
  updateNodeLabels: async (clusterId: number, nodeName: string, labels: { [key: string]: string }): Promise<void> => {
    await axios.patch(`${API_BASE_URL}/clusters/${clusterId}/nodes/${nodeName}/labels`, { labels });
  },

  // 更新节点污点
  updateNodeTaints: async (clusterId: number, nodeName: string, taints: Array<{
    key: string;
    value: string;
    effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
  }>): Promise<void> => {
    await axios.patch(`${API_BASE_URL}/clusters/${clusterId}/nodes/${nodeName}/taints`, { taints });
  },

  // 删除节点标签
  deleteNodeLabel: async (clusterId: number, nodeName: string, labelKey: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/clusters/${clusterId}/nodes/${nodeName}/labels/${labelKey}`);
  },

  // 删除节点污点
  deleteNodeTaint: async (clusterId: number, nodeName: string, taintKey: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/clusters/${clusterId}/nodes/${nodeName}/taints/${taintKey}`);
  },
}; 