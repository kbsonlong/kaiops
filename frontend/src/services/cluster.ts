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
  name: string;
  labels: Record<string, string>;
  status: {
    ready: boolean;
    conditions: Array<{
      type: string;
      status: string;
      message: string;
    }>;
  };
  capacity: Record<string, string>;
  allocatable: Record<string, string>;
  // 从 labels 中获取角色信息
  getRole?: () => string;
}

interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    page_size: number;
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
  getClusterNodes: async (id: number): Promise<NodeInfo[]> => {
    const response = await axios.get(`${API_BASE_URL}/clusters/${id}/nodes`);
    // 从 response.data.nodes 中获取节点数组
    return Array.isArray(response.data.nodes) ? response.data.nodes : [];
  },
}; 