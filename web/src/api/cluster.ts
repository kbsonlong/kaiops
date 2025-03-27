import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface ClusterMetrics {
  cpu: {
    total: number;
    used: number;
  };
  memory: {
    total: number;
    used: number;
  };
  nodes: {
    ready: number;
    total: number;
  };
  pods: {
    running: number;
    total: number;
  };
}

export interface Node {
  metadata: {
    name: string;
    creationTimestamp: string;
  };
  status: {
    conditions: Array<{
      type: string;
      status: string;
    }>;
    nodeInfo: {
      kubeletVersion: string;
      osImage: string;
      kernelVersion: string;
      containerRuntimeVersion: string;
    };
  };
}

export interface Pod {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
  };
  status: {
    phase: string;
    podIP: string;
    startTime: string;
  };
}

export interface Service {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
  };
  spec: {
    type: string;
    clusterIP: string;
    ports: Array<{
      port: number;
      targetPort: number;
      protocol: string;
    }>;
  };
}

export interface Event {
  metadata: {
    name: string;
    namespace: string;
  };
  type: string;
  reason: string;
  message: string;
  lastTimestamp: string;
  involvedObject: {
    kind: string;
    name: string;
  };
}

export const clusterAPI = {
  // 获取集群资源使用情况
  getMetrics: async (): Promise<ClusterMetrics> => {
    const response = await axios.get(`${API_BASE_URL}/metrics`);
    return response.data;
    // const data = {
    //   "cpu": {
    //     "total": 100 , 
    //     "used": 30
    //   },
    //   "memory": {
    //     "total": 100 , 
    //     "used": 30
    //   },
    //   nodes: {
    //     "ready": 2,
		// 	  "total": 2,
    //   },
    //   pods: {
    //     "running": 10,
		// 	  "total":   10,
    //   }
    // }
    // return data
  },

  // 获取节点列表
  getNodes: async (): Promise<Node[]> => {
    const response = await axios.get(`${API_BASE_URL}/nodes`);
    return response.data;
  },

  // 获取 Pod 列表
  getPods: async (namespace: string = ''): Promise<Pod[]> => {
    const response = await axios.get(`${API_BASE_URL}/pods`, {
      params: { namespace },
    });
    return response.data;
  },

  // 获取服务列表
  getServices: async (namespace: string = ''): Promise<Service[]> => {
    const response = await axios.get(`${API_BASE_URL}/services`, {
      params: { namespace },
    });
    return response.data;
  },

  // 获取事件列表
  getEvents: async (namespace: string = ''): Promise<Event[]> => {
    const response = await axios.get(`${API_BASE_URL}/events`, {
      params: { namespace },
    });
    return response.data;
  },
}; 