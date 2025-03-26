package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"

	"gorm.io/gorm"
)

// Cluster 表示一个 Kubernetes 集群
// @Description Kubernetes 集群信息
type Cluster struct {
	gorm.Model
	// 集群名称
	Name string `json:"name" example:"prod-cluster"`
	// 集群中文名称
	CnName string `json:"cn_name" example:"生产环境集群"`
	// 集群类型
	ClusterType string `json:"cluster_type" example:"kubernetes"`
	// Kubernetes 配置文件内容
	KubeConfig string `json:"kube_config" example:"apiVersion: v1\nkind: Config\nclusters:\n- cluster:\n    server: https://api.example.com"`
	// 集群 API 地址
	ClusterApi string `json:"cluster_api" example:"https://api.example.com"`
	// 集群状态
	ClusterStatus bool `json:"cluster_status" example:"true"`
	// 集群版本
	ClusterVersion string `json:"cluster_version" example:"v1.20.0"`
	// 集群区域
	ClusterRegion string `json:"cluster_region" example:"cn-east-1"`
	// 集群可用区
	ClusterZone JSONArray `json:"cluster_zone" gorm:"type:json" example:"[\"zone-a\", \"zone-b\"]"`
	// 集群网络配置
	ClusterNetwork Network `json:"cluster_network" gorm:"type:json"`
	// 集群子网
	ClusterSubnet JSONArray `json:"cluster_subnet" gorm:"type:json" example:"[\"subnet-1\", \"subnet-2\"]"`
}

// Network 表示集群的网络配置
// @Description 集群网络配置信息
type Network struct {
	// Pod 网段
	PodCidr string `json:"pod_cidr" example:"10.244.0.0/16"`
	// Service 网段
	SvcCidr string `json:"svc_cidr" example:"10.96.0.0/12"`
}

// Value 实现 driver.Valuer 接口
func (n Network) Value() (driver.Value, error) {
	return json.Marshal(n)
}

// Scan 实现 sql.Scanner 接口
func (n *Network) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	s, ok := value.([]byte)
	if !ok {
		return errors.New("invalid scan source")
	}
	return json.Unmarshal(s, &n)
}

// JSONArray 自定义 JSON 数组类型
type JSONArray []string

// Value 实现 driver.Valuer 接口
func (j JSONArray) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan 实现 sql.Scanner 接口
func (j *JSONArray) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	s, ok := value.([]byte)
	if !ok {
		return errors.New("invalid scan source")
	}
	return json.Unmarshal(s, &j)
}
