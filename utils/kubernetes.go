package utils

import (
	"encoding/base64"
	"fmt"
	"os"
	"sync"

	"github.com/kbsonlong/kaiops/models"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

var (
	// clientsets 存储所有集群的客户端连接
	clientsets = make(map[uint]*kubernetes.Clientset)
	// clientsetsMutex 用于保护 clientsets map 的并发访问
	clientsetsMutex sync.RWMutex
)

// InitKubernetesClient 初始化指定集群的 Kubernetes 客户端
func InitKubernetesClient(cluster models.Cluster) error {
	// 解码 base64 编码的 kubeconfig
	kubeconfigBytes, err := base64.StdEncoding.DecodeString(cluster.KubeConfig)
	if err != nil {
		return fmt.Errorf("kubeconfig 解码失败: %v", err)
	}

	// 创建临时 kubeconfig 文件
	tmpKubeconfig := fmt.Sprintf("%s/.kube/config_%d", homedir.HomeDir(), cluster.ID)
	if err := os.WriteFile(tmpKubeconfig, kubeconfigBytes, 0600); err != nil {
		return fmt.Errorf("创建临时 kubeconfig 文件失败: %v", err)
	}
	defer os.Remove(tmpKubeconfig)

	// 创建 kubernetes 客户端
	config, err := clientcmd.BuildConfigFromFlags("", tmpKubeconfig)
	if err != nil {
		return fmt.Errorf("创建 kubernetes 配置失败: %v", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return fmt.Errorf("创建 kubernetes 客户端失败: %v", err)
	}

	// 将客户端存储到全局 map 中
	clientsetsMutex.Lock()
	clientsets[cluster.ID] = clientset
	clientsetsMutex.Unlock()

	return nil
}

// GetKubernetesClient 获取指定集群的 Kubernetes 客户端
func GetKubernetesClient(clusterID uint) (*kubernetes.Clientset, error) {
	// 从全局 map 中获取客户端
	clientsetsMutex.RLock()
	clientset, exists := clientsets[clusterID]
	clientsetsMutex.RUnlock()

	if exists {
		return clientset, nil
	}

	return nil, fmt.Errorf("集群 %d 的客户端未初始化", clusterID)
}

// RemoveKubernetesClient 从全局 map 中移除指定集群的客户端
func RemoveKubernetesClient(clusterID uint) {
	clientsetsMutex.Lock()
	delete(clientsets, clusterID)
	clientsetsMutex.Unlock()
}
