package types

// ClusterMetrics 表示集群资源使用指标
type ClusterMetrics struct {
	CPU struct {
		Used  int64 `json:"used"`  // 已使用的 CPU (毫核)
		Total int64 `json:"total"` // 总 CPU (毫核)
	} `json:"cpu"`
	Memory struct {
		Used  int64 `json:"used"`  // 已使用的内存 (字节)
		Total int64 `json:"total"` // 总内存 (字节)
	} `json:"memory"`
	Nodes struct {
		Ready int `json:"ready"` // 就绪节点数
		Total int `json:"total"` // 总节点数
	} `json:"nodes"`
	Pods struct {
		Running int `json:"running"` // 运行中的 Pod 数
		Total   int `json:"total"`   // 总 Pod 数
	} `json:"pods"`
}

// Event 表示集群事件
type Event struct {
	Type           string `json:"type"`
	Reason         string `json:"reason"`
	Message        string `json:"message"`
	LastTimestamp  string `json:"lastTimestamp"`
	InvolvedObject struct {
		Kind string `json:"kind"`
		Name string `json:"name"`
	} `json:"involvedObject"`
}

// CreateClusterRequest 表示创建集群的请求
type CreateClusterRequest struct {
	Name       string `json:"name" binding:"required"`
	ApiServer  string `json:"apiServer" binding:"required"`
	KubeConfig string `json:"kubeConfig" binding:"required"`
}

// UpdateClusterRequest 表示更新集群的请求
type UpdateClusterRequest struct {
	Name       string `json:"name" binding:"required"`
	ApiServer  string `json:"apiServer" binding:"required"`
	KubeConfig string `json:"kubeConfig"`
}

// ClusterResponse 表示集群信息的响应
type ClusterResponse struct {
	ID            uint   `json:"id"`
	Name          string `json:"name"`
	ApiServer     string `json:"apiServer"`
	Status        string `json:"status"`
	CreatedAt     string `json:"createdAt"`
	LastConnected string `json:"lastConnected,omitempty"`
}

// ClusterListResponse 表示集群列表的响应
type ClusterListResponse struct {
	Total    int               `json:"total"`
	Clusters []ClusterResponse `json:"clusters"`
}
