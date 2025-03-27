package k8s

import (
	"context"
	"fmt"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

// Client Kubernetes 客户端
type Client struct {
	clientset *kubernetes.Clientset
}

var defaultClient *Client

// GetClient 获取默认客户端
func GetClient() *Client {
	if defaultClient == nil {
		defaultClient = &Client{}
	}
	return defaultClient
}

// InitClient 初始化客户端
func (c *Client) InitClient(kubeconfig string) error {
	config, err := clientcmd.RESTConfigFromKubeConfig([]byte(kubeconfig))
	if err != nil {
		return fmt.Errorf("解析 kubeconfig 失败: %v", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return fmt.Errorf("创建 Kubernetes 客户端失败: %v", err)
	}

	c.clientset = clientset
	return nil
}

// GetNodes 获取节点列表
func (c *Client) GetNodes() (*corev1.NodeList, error) {
	if c.clientset == nil {
		return nil, fmt.Errorf("客户端未初始化")
	}
	return c.clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
}

// GetPods 获取 Pod 列表
func (c *Client) GetPods(namespace string) (*corev1.PodList, error) {
	if c.clientset == nil {
		return nil, fmt.Errorf("客户端未初始化")
	}
	return c.clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
}

// GetServices 获取服务列表
func (c *Client) GetServices(namespace string) (*corev1.ServiceList, error) {
	if c.clientset == nil {
		return nil, fmt.Errorf("客户端未初始化")
	}
	return c.clientset.CoreV1().Services(namespace).List(context.TODO(), metav1.ListOptions{})
}

// GetEvents 获取事件列表
func (c *Client) GetEvents(namespace string) (*corev1.EventList, error) {
	if c.clientset == nil {
		return nil, fmt.Errorf("客户端未初始化")
	}
	return c.clientset.CoreV1().Events(namespace).List(context.TODO(), metav1.ListOptions{})
}
