package handler

import (
	"net/http"
	"strconv"

	"k8s-dashboard/internal/service"
	"k8s-dashboard/internal/types"

	"github.com/gin-gonic/gin"
)

// ClusterHandler 集群处理器
type ClusterHandler struct {
	clusterService *service.ClusterService
}

// NewClusterHandler 创建集群处理器
func NewClusterHandler(clusterService *service.ClusterService) *ClusterHandler {
	return &ClusterHandler{
		clusterService: clusterService,
	}
}

// RegisterRoutes 注册路由
func (h *ClusterHandler) RegisterRoutes(r *gin.Engine) {
	clusters := r.Group("/api/clusters")
	{
		clusters.GET("", h.ListClusters)
		clusters.POST("", h.CreateCluster)
		clusters.GET("/:id", h.GetCluster)
		clusters.PUT("/:id", h.UpdateCluster)
		clusters.DELETE("/:id", h.DeleteCluster)
		clusters.GET("/:id/metrics", h.GetClusterMetrics)
		clusters.GET("/:id/events", h.GetEvents)
	}
}

// ListClusters 获取集群列表
func (h *ClusterHandler) ListClusters(c *gin.Context) {
	clusters, err := h.clusterService.ListClusters()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, clusters)
}

// CreateCluster 创建集群
func (h *ClusterHandler) CreateCluster(c *gin.Context) {
	var req types.CreateClusterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cluster, err := h.clusterService.CreateCluster(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cluster)
}

// GetCluster 获取集群信息
func (h *ClusterHandler) GetCluster(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的集群 ID"})
		return
	}

	cluster, err := h.clusterService.GetCluster(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cluster)
}

// UpdateCluster 更新集群信息
func (h *ClusterHandler) UpdateCluster(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的集群 ID"})
		return
	}

	var req types.UpdateClusterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cluster, err := h.clusterService.UpdateCluster(uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cluster)
}

// DeleteCluster 删除集群
func (h *ClusterHandler) DeleteCluster(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的集群 ID"})
		return
	}

	if err := h.clusterService.DeleteCluster(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// GetClusterMetrics 获取集群指标
func (h *ClusterHandler) GetClusterMetrics(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的集群 ID"})
		return
	}

	metrics, err := h.clusterService.GetClusterMetrics(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, metrics)
}

// GetEvents 获取集群事件
func (h *ClusterHandler) GetEvents(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的集群 ID"})
		return
	}

	events, err := h.clusterService.GetEvents(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, events)
}
