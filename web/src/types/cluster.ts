export interface Cluster {
  id: string;
  name: string;
  apiServer: string;
  status: 'connected' | 'disconnected' | 'error';
  kubeConfig?: string;
  createdAt: string;
  lastConnected?: string;
} 