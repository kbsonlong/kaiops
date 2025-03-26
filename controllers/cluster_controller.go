package controllers

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"

	"github.com/kbsonlong/kaiops/models"
)

type ClusterController struct {
	DB *gorm.DB
}

// CreateCluster godoc
// @Summary      创建新的集群
// @Description  创建一个新的 Kubernetes 集群
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        cluster body models.Cluster true "集群信息"
// @Success      201 {object} models.Cluster "创建成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters [post]
func (c *ClusterController) CreateCluster(ctx *gin.Context) {
	var cluster models.Cluster
	if err := ctx.ShouldBindJSON(&cluster); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.DB.Create(&cluster).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, cluster)
}

// GetCluster godoc
// @Summary      获取单个集群信息
// @Description  根据ID获取集群的详细信息
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        id path int true "集群ID"
// @Success      200 {object} models.Cluster "获取成功"
// @Failure      404 {object} map[string]string "集群不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{id} [get]
func (c *ClusterController) GetCluster(ctx *gin.Context) {
	id := ctx.Param("id")
	var cluster models.Cluster

	if err := c.DB.First(&cluster, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "集群不存在"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, cluster)
}

// ListClusters godoc
// @Summary      获取集群列表
// @Description  获取所有集群的列表，支持分页和筛选
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        page query int false "页码" default(1)
// @Param        page_size query int false "每页数量" default(10)
// @Param        cluster_type query string false "集群类型"
// @Param        region query string false "区域"
// @Success      200 {object} map[string]interface{} "获取成功"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters [get]
func (c *ClusterController) ListClusters(ctx *gin.Context) {
	var clusters []models.Cluster
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "10"))
	offset := (page - 1) * pageSize

	// 构建查询条件
	query := c.DB.Model(&models.Cluster{})

	// 支持按集群类型筛选
	if clusterType := ctx.Query("cluster_type"); clusterType != "" {
		query = query.Where("cluster_type = ?", clusterType)
	}

	// 支持按区域筛选
	if region := ctx.Query("region"); region != "" {
		query = query.Where("cluster_region = ?", region)
	}

	if err := query.Offset(offset).Limit(pageSize).Find(&clusters).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取总数
	var total int64
	query.Count(&total)

	ctx.JSON(http.StatusOK, gin.H{
		"data": clusters,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// UpdateCluster godoc
// @Summary      更新集群信息
// @Description  根据ID更新集群的详细信息
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        id path int true "集群ID"
// @Param        cluster body models.Cluster true "更新的集群信息"
// @Success      200 {object} models.Cluster "更新成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      404 {object} map[string]string "集群不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{id} [put]
func (c *ClusterController) UpdateCluster(ctx *gin.Context) {
	id := ctx.Param("id")
	var cluster models.Cluster

	if err := c.DB.First(&cluster, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "集群不存在"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := ctx.ShouldBindJSON(&cluster); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.DB.Save(&cluster).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, cluster)
}

// DeleteCluster godoc
// @Summary      删除集群
// @Description  根据ID删除指定的集群
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        id path int true "集群ID"
// @Success      200 {object} map[string]string "删除成功"
// @Failure      404 {object} map[string]string "集群不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{id} [delete]
func (c *ClusterController) DeleteCluster(ctx *gin.Context) {
	id := ctx.Param("id")
	var cluster models.Cluster

	if err := c.DB.First(&cluster, id).Error; err != nil {
		fmt.Println(cluster.CnName)
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "集群不存在"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := c.DB.Delete(&cluster).Error; err != nil {
		fmt.Println(cluster.Name)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "集群删除成功"})
}

// getKubernetesClient 获取 Kubernetes 客户端
func (c *ClusterController) getKubernetesClient(ctx *gin.Context, clusterID string) (*kubernetes.Clientset, error) {
	// 获取集群信息
	var cluster models.Cluster
	if err := c.DB.First(&cluster, clusterID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "集群不存在"})
			return nil, err
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return nil, err
	}

	// 解码 base64 编码的 kubeconfig
	kubeconfigBytes, err := base64.StdEncoding.DecodeString(cluster.KubeConfig)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "kubeconfig 解码失败"})
		return nil, err
	}

	// 创建临时 kubeconfig 文件
	tmpKubeconfig := fmt.Sprintf("%s/.kube/config_%d", homedir.HomeDir(), cluster.ID)
	if err := os.WriteFile(tmpKubeconfig, kubeconfigBytes, 0600); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "创建临时 kubeconfig 文件失败"})
		return nil, err
	}
	defer os.Remove(tmpKubeconfig)

	// 创建 kubernetes 客户端
	config, err := clientcmd.BuildConfigFromFlags("", tmpKubeconfig)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "创建 kubernetes 配置失败"})
		return nil, err
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "创建 kubernetes 客户端失败"})
		return nil, err
	}

	return clientset, nil
}

// GetClusterNodes godoc
// @Summary      获取集群节点状态
// @Description  通过 kubeconfig 获取集群的 WorkNode 节点状态
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        id path int true "集群ID"
// @Success      200 {object} map[string]interface{} "获取成功"
// @Failure      404 {object} map[string]string "集群不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{id}/nodes [get]
func (c *ClusterController) GetClusterNodes(ctx *gin.Context) {
	id := ctx.Param("id")

	clientset, err := c.getKubernetesClient(ctx, id)
	if err != nil {
		return
	}

	// 获取节点列表
	nodes, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取节点列表失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"nodes": nodes,
	})
}

// UpdateNodeLabels godoc
// @Summary      更新节点标签
// @Description  更新指定集群中特定节点的标签
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        id path int true "集群ID"
// @Param        nodeName path string true "节点名称"
// @Param        labels body map[string]string true "节点标签"
// @Success      204 {object} map[string]string "更新成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      404 {object} map[string]string "集群不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{id}/nodes/{nodeName}/labels [patch]
func (c *ClusterController) UpdateNodeLabels(ctx *gin.Context) {
	id := ctx.Param("id")
	nodeName := ctx.Param("nodeName")
	fmt.Print(id, nodeName)

	var request struct {
		Labels map[string]string `json:"labels"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	clientset, err := c.getKubernetesClient(ctx, id)
	if err != nil {
		return
	}

	// 获取节点
	node, err := clientset.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取节点失败"})
		return
	}

	// 更新标签
	node.Labels = request.Labels
	_, err = clientset.CoreV1().Nodes().Update(ctx, node, metav1.UpdateOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "更新节点标签失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "节点标签更新成功"})
}

// DeleteNodeLabel godoc
// @Summary      删除节点标签
// @Description  删除指定集群中特定节点的指定标签
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        id path int true "集群ID"
// @Param        nodeName path string true "节点名称"
// @Param        labelKey path string true "标签键"
// @Success      200 {object} map[string]string "删除成功"
// @Failure      404 {object} map[string]string "集群不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{id}/nodes/{nodeName}/labels/{labelKey} [delete]
func (c *ClusterController) DeleteNodeLabel(ctx *gin.Context) {
	id := ctx.Param("id")
	nodeName := ctx.Param("nodeName")
	labelKey := ctx.Param("labelKey")

	clientset, err := c.getKubernetesClient(ctx, id)
	if err != nil {
		return
	}

	// 获取节点
	node, err := clientset.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取节点失败"})
		return
	}

	// 删除标签
	delete(node.Labels, labelKey)
	_, err = clientset.CoreV1().Nodes().Update(ctx, node, metav1.UpdateOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "删除节点标签失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "节点标签删除成功"})
}

// UpdateNodeTaints godoc
// @Summary      更新节点污点
// @Description  更新指定集群中特定节点的污点
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        id path int true "集群ID"
// @Param        nodeName path string true "节点名称"
// @Param        taints body []corev1.Taint true "节点污点"
// @Success      200 {object} map[string]string "更新成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      404 {object} map[string]string "集群不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{id}/nodes/{nodeName}/taints [patch]
func (c *ClusterController) UpdateNodeTaints(ctx *gin.Context) {
	id := ctx.Param("id")
	nodeName := ctx.Param("nodeName")
	fmt.Println(id, nodeName)

	var request struct {
		Taints []corev1.Taint `json:"taints"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	clientset, err := c.getKubernetesClient(ctx, id)
	if err != nil {
		return
	}

	// 获取节点
	node, err := clientset.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取节点失败"})
		return
	}

	// 更新污点
	node.Spec.Taints = request.Taints
	_, err = clientset.CoreV1().Nodes().Update(ctx, node, metav1.UpdateOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "更新节点污点失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "节点污点更新成功"})
}

// DeleteNodeTaint godoc
// @Summary      删除节点污点
// @Description  删除指定集群中特定节点的指定污点
// @Tags         clusters
// @Accept       json
// @Produce      json
// @Param        id path int true "集群ID"
// @Param        nodeName path string true "节点名称"
// @Param        taintKey path string true "污点键"
// @Success      200 {object} map[string]string "删除成功"
// @Failure      404 {object} map[string]string "集群不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{id}/nodes/{nodeName}/taints/{taintKey} [delete]
func (c *ClusterController) DeleteNodeTaint(ctx *gin.Context) {
	id := ctx.Param("id")
	nodeName := ctx.Param("nodeName")
	taintKey := ctx.Param("taintKey")

	clientset, err := c.getKubernetesClient(ctx, id)
	if err != nil {
		return
	}

	// 获取节点
	node, err := clientset.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取节点失败"})
		return
	}

	// 删除污点
	newTaints := make([]corev1.Taint, 0)
	for _, taint := range node.Spec.Taints {
		if taint.Key != taintKey {
			newTaints = append(newTaints, taint)
		}
	}
	node.Spec.Taints = newTaints

	_, err = clientset.CoreV1().Nodes().Update(ctx, node, metav1.UpdateOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "删除节点污点失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "节点污点删除成功"})
}
