package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"

	"gorm.io/gorm"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Containers 是 Container 切片的自定义类型
type Containers []Container

// Value 实现 driver.Valuer 接口
func (c Containers) Value() (driver.Value, error) {
	if c == nil {
		return nil, nil
	}
	return json.Marshal(c)
}

// Scan 实现 sql.Scanner 接口
func (c *Containers) Scan(value interface{}) error {
	if value == nil {
		*c = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid scan source")
	}

	// 尝试解析为单个容器
	var singleContainer Container
	if err := json.Unmarshal(bytes, &singleContainer); err == nil {
		*c = Containers{singleContainer}
		return nil
	}

	// 尝试解析为容器数组
	var containers []Container
	if err := json.Unmarshal(bytes, &containers); err == nil {
		*c = containers
		return nil
	}

	// 如果都失败了，返回错误
	return fmt.Errorf("failed to unmarshal Containers: %s", string(bytes))
}

// StringMap 是 map[string]string 的自定义类型
type StringMap map[string]string

// Value 实现 driver.Valuer 接口
func (m StringMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

// Scan 实现 sql.Scanner 接口
func (m *StringMap) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("invalid scan source")
	}

	var temp map[string]string
	if err := json.Unmarshal(bytes, &temp); err != nil {
		return err
	}

	*m = temp
	return nil
}

// Workload 表示一个 Kubernetes 工作负载
// @Description Kubernetes 工作负载信息
type Workload struct {
	gorm.Model
	// 工作负载名称
	Name string `json:"name" example:"nginx-deployment"`
	// 工作负载类型 (Deployment, StatefulSet, DaemonSet)
	Kind string `json:"kind" example:"Deployment"`
	// 所属命名空间
	Namespace string `json:"namespace" example:"default"`
	// 所属集群ID
	ClusterID uint `json:"cluster_id" example:"1"`
	// 副本数
	Replicas int32 `json:"replicas" example:"3"`
	// 容器配置
	Containers Containers `json:"containers" gorm:"type:json"`
	// 标签
	Labels StringMap `json:"labels" gorm:"type:json"`
	// 注解
	Annotations StringMap `json:"annotations" gorm:"type:json"`
	// 工作负载状态
	Status WorkloadStatus `json:"status" gorm:"type:json"`
}

// Container 表示容器配置
type Container struct {
	// 容器名称
	Name string `json:"name" example:"nginx"`
	// 容器镜像
	Image string `json:"image" example:"nginx:1.14.2"`
	// 资源请求
	Requests ResourceList `json:"requests"`
	// 资源限制
	Limits ResourceList `json:"limits"`
	// 环境变量
	Env []EnvVar `json:"env"`
	// 端口配置
	Ports []ContainerPort `json:"ports"`
}

// ResourceList 表示资源配置
type ResourceList struct {
	// CPU请求/限制
	CPU string `json:"cpu" example:"100m"`
	// 内存请求/限制
	Memory string `json:"memory" example:"128Mi"`
}

// EnvVar 表示环境变量
type EnvVar struct {
	// 环境变量名称
	Name string `json:"name" example:"NGINX_PORT"`
	// 环境变量值
	Value string `json:"value" example:"80"`
}

// ContainerPort 表示容器端口配置
type ContainerPort struct {
	// 端口名称
	Name string `json:"name" example:"http"`
	// 容器端口
	ContainerPort int32 `json:"container_port" example:"80"`
	// 协议
	Protocol string `json:"protocol" example:"TCP"`
}

// WorkloadStatus 表示工作负载状态
type WorkloadStatus struct {
	// 期望副本数
	DesiredReplicas int32 `json:"desired_replicas" example:"3"`
	// 当前副本数
	CurrentReplicas int32 `json:"current_replicas" example:"2"`
	// 就绪副本数
	ReadyReplicas int32 `json:"ready_replicas" example:"2"`
	// 更新状态
	Conditions []WorkloadCondition `json:"conditions"`
}

// WorkloadCondition 表示工作负载状态条件
type WorkloadCondition struct {
	// 状态类型
	Type string `json:"type" example:"Available"`
	// 状态
	Status string `json:"status" example:"True"`
	// 最后更新时间
	LastUpdateTime metav1.Time `json:"last_update_time"`
	// 最后转换时间
	LastTransitionTime metav1.Time `json:"last_transition_time"`
	// 原因
	Reason string `json:"reason" example:"MinimumReplicasAvailable"`
	// 消息
	Message string `json:"message" example:"Deployment has minimum availability."`
}

// Value 实现 driver.Valuer 接口
func (c Container) Value() (driver.Value, error) {
	return json.Marshal(c)
}

// Scan 实现 sql.Scanner 接口
func (c *Container) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	s, ok := value.([]byte)
	if !ok {
		return errors.New("invalid scan source")
	}
	return json.Unmarshal(s, &c)
}

// Value 实现 driver.Valuer 接口
func (s WorkloadStatus) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan 实现 sql.Scanner 接口
func (s *WorkloadStatus) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	data, ok := value.([]byte)
	if !ok {
		return errors.New("invalid scan source")
	}
	return json.Unmarshal(data, &s)
}
