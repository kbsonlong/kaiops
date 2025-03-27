package service

import (
	"context"
	"fmt"
	"time"

	"k8s-dashboard/internal/models"
	"k8s-dashboard/internal/types"
	"k8s-dashboard/pkg/k8s"

	"gorm.io/gorm"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ClusterService 集群服务
type ClusterService struct {
	db     *gorm.DB
	client *k8s.Client
}

func NewClusterService(db *gorm.DB) *ClusterService {
	return &ClusterService{
		db:     db,
		client: k8s.GetClient(),
	}
}

// ListClusters 获取集群列表
func (s *ClusterService) ListClusters() (*types.ClusterListResponse, error) {
	var clusters []models.Cluster
	if err := s.db.Find(&clusters).Error; err != nil {
		return nil, fmt.Errorf("查询集群列表失败: %v", err)
	}

	response := &types.ClusterListResponse{
		Total:    len(clusters),
		Clusters: make([]types.ClusterResponse, 0, len(clusters)),
	}

	for _, cluster := range clusters {
		response.Clusters = append(response.Clusters, types.ClusterResponse{
			ID:            cluster.ID,
			Name:          cluster.Name,
			ApiServer:     cluster.ClusterApi,
			Status:        s.getClusterStatus(cluster),
			CreatedAt:     cluster.CreatedAt.Format(time.RFC3339),
			LastConnected: cluster.UpdatedAt.Format(time.RFC3339),
		})
	}

	return response, nil
}

// CreateCluster 创建集群
func (s *ClusterService) CreateCluster(req types.CreateClusterRequest) (*types.ClusterResponse, error) {
	cluster := &models.Cluster{
		Name:       req.Name,
		ClusterApi: req.ApiServer,
		KubeConfig: req.KubeConfig,
	}

	if err := s.db.Create(cluster).Error; err != nil {
		return nil, fmt.Errorf("创建集群失败: %v", err)
	}

	return &types.ClusterResponse{
		ID:        cluster.ID,
		Name:      cluster.Name,
		ApiServer: cluster.ClusterApi,
		Status:    s.getClusterStatus(*cluster),
		CreatedAt: cluster.CreatedAt.Format(time.RFC3339),
	}, nil
}

// GetCluster 获取集群信息
func (s *ClusterService) GetCluster(id uint) (*types.ClusterResponse, error) {
	var cluster models.Cluster
	if err := s.db.First(&cluster, id).Error; err != nil {
		return nil, fmt.Errorf("获取集群信息失败: %v", err)
	}

	return &types.ClusterResponse{
		ID:            cluster.ID,
		Name:          cluster.Name,
		ApiServer:     cluster.ClusterApi,
		Status:        s.getClusterStatus(cluster),
		CreatedAt:     cluster.CreatedAt.Format(time.RFC3339),
		LastConnected: cluster.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// UpdateCluster 更新集群信息
func (s *ClusterService) UpdateCluster(id uint, req types.UpdateClusterRequest) (*types.ClusterResponse, error) {
	var cluster models.Cluster
	if err := s.db.First(&cluster, id).Error; err != nil {
		return nil, fmt.Errorf("获取集群信息失败: %v", err)
	}

	cluster.Name = req.Name
	cluster.ClusterApi = req.ApiServer
	if req.KubeConfig != "" {
		cluster.KubeConfig = req.KubeConfig
	}

	if err := s.db.Save(&cluster).Error; err != nil {
		return nil, fmt.Errorf("更新集群信息失败: %v", err)
	}

	return &types.ClusterResponse{
		ID:            cluster.ID,
		Name:          cluster.Name,
		ApiServer:     cluster.ClusterApi,
		Status:        s.getClusterStatus(cluster),
		CreatedAt:     cluster.CreatedAt.Format(time.RFC3339),
		LastConnected: cluster.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// DeleteCluster 删除集群
func (s *ClusterService) DeleteCluster(id uint) error {
	if err := s.db.Delete(&models.Cluster{}, id).Error; err != nil {
		return fmt.Errorf("删除集群失败: %v", err)
	}
	return nil
}

// GetClusterMetrics 获取集群指标
func (s *ClusterService) GetClusterMetrics(id uint) (*types.ClusterMetrics, error) {
	var cluster models.Cluster
	if err := s.db.First(&cluster, id).Error; err != nil {
		return nil, fmt.Errorf("获取集群信息失败: %v", err)
	}

	// 初始化集群客户端
	if err := s.initClusterClient(cluster); err != nil {
		return nil, err
	}

	metrics := &types.ClusterMetrics{}

	// 获取节点指标
	nodes, err := s.client.GetNodes()
	if err != nil {
		return nil, fmt.Errorf("获取节点信息失败: %v", err)
	}

	var totalCPU, totalMemory, usedCPU, usedMemory int64
	var readyNodes int
	for _, node := range nodes.Items {
		// 计算总资源
		cpu := node.Status.Capacity.Cpu().MilliValue()
		memory := node.Status.Capacity.Memory().Value()
		totalCPU += cpu
		totalMemory += memory

		// 计算已用资源
		usedCPU += node.Status.Allocatable.Cpu().MilliValue()
		usedMemory += node.Status.Allocatable.Memory().Value()

		// 统计就绪节点
		for _, cond := range node.Status.Conditions {
			if cond.Type == "Ready" && cond.Status == "True" {
				readyNodes++
				break
			}
		}
	}

	// 获取 Pod 指标
	pods, err := s.client.GetPods("")
	if err != nil {
		return nil, fmt.Errorf("获取 Pod 信息失败: %v", err)
	}

	var runningPods int
	for _, pod := range pods.Items {
		if pod.Status.Phase == "Running" {
			runningPods++
		}
	}

	// 填充指标数据
	metrics.CPU.Total = totalCPU
	metrics.CPU.Used = usedCPU
	metrics.Memory.Total = totalMemory
	metrics.Memory.Used = usedMemory
	metrics.Nodes.Total = len(nodes.Items)
	metrics.Nodes.Ready = readyNodes
	metrics.Pods.Total = len(pods.Items)
	metrics.Pods.Running = runningPods

	return metrics, nil
}

// GetEvents 获取集群事件
func (s *ClusterService) GetEvents(id uint) ([]types.Event, error) {
	var cluster models.Cluster
	if err := s.db.First(&cluster, id).Error; err != nil {
		return nil, fmt.Errorf("获取集群信息失败: %v", err)
	}

	// 初始化集群客户端
	if err := s.initClusterClient(cluster); err != nil {
		return nil, err
	}

	k8sEvents, err := s.client.GetEvents("")
	if err != nil {
		return nil, fmt.Errorf("获取事件失败: %v", err)
	}

	events := make([]types.Event, 0, len(k8sEvents.Items))
	for _, event := range k8sEvents.Items {
		events = append(events, types.Event{
			Type:          string(event.Type),
			Reason:        event.Reason,
			Message:       event.Message,
			LastTimestamp: event.LastTimestamp.Format(time.RFC3339),
			InvolvedObject: struct {
				Kind string `json:"kind"`
				Name string `json:"name"`
			}{
				Kind: event.InvolvedObject.Kind,
				Name: event.InvolvedObject.Name,
			},
		})
	}

	return events, nil
}

// getClusterStatus 获取集群状态
func (s *ClusterService) getClusterStatus(cluster models.Cluster) string {
	if err := s.initClusterClient(cluster); err != nil {
		return "error"
	}

	_, err := s.client.GetNodes()
	if err != nil {
		return "disconnected"
	}

	return "connected"
}

// initClusterClient 初始化集群客户端
func (s *ClusterService) initClusterClient(cluster models.Cluster) error {
	if err := s.client.InitClient(cluster.KubeConfig); err != nil {
		return fmt.Errorf("初始化集群客户端失败: %v", err)
	}
	return nil
}

// GetNodes 获取节点列表
func (s *ClusterService) GetNodes() ([]corev1.Node, error) {
	client := k8s.GetClient()
	nodes, err := client.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return nodes.Items, nil
}

// GetPods 获取 Pod 列表
func (s *ClusterService) GetPods(namespace string) ([]corev1.Pod, error) {
	client := k8s.GetClient()
	pods, err := client.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return pods.Items, nil
}

// GetServices 获取服务列表
func (s *ClusterService) GetServices(namespace string) ([]corev1.Service, error) {
	client := k8s.GetClient()
	services, err := client.CoreV1().Services(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return services.Items, nil
}
