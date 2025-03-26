package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kbsonlong/kaiops/models"
	"github.com/kbsonlong/kaiops/utils"
	"gorm.io/gorm"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type WorkloadController struct {
	DB *gorm.DB
}

// CreateDeployment godoc
// @Summary      创建Deployment工作负载
// @Description  在指定集群和命名空间中创建新的Deployment
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        clusterId path int true "集群ID"
// @Param        namespace path string true "命名空间"
// @Param        deployment body models.Workload true "Deployment信息"
// @Success      201 {object} models.Workload "创建成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{clusterId}/workloads/deployments/{namespace} [post]
func (w *WorkloadController) CreateDeployment(ctx *gin.Context) {
	clusterId, _ := strconv.Atoi(ctx.Param("clusterId"))
	namespace := ctx.Param("namespace")

	var workload models.Workload
	if err := ctx.ShouldBindJSON(&workload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置工作负载类型和基本信息
	workload.Kind = "Deployment"
	workload.ClusterID = uint(clusterId)
	workload.Namespace = namespace

	// 获取集群信息
	var cluster models.Cluster
	if err := w.DB.First(&cluster, clusterId).Error; err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "集群不存在"})
		return
	}

	// 初始化并获取 Kubernetes 客户端
	if err := utils.InitKubernetesClient(cluster); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	clientset, err := utils.GetKubernetesClient(cluster.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 根据工作负载类型创建资源
	switch workload.Kind {
	case "Deployment":
		deployment := createDeployment(workload)
		_, err = clientset.AppsV1().Deployments(workload.Namespace).Create(ctx, deployment, metav1.CreateOptions{})
	case "StatefulSet":
		statefulSet := createStatefulSet(workload)
		_, err = clientset.AppsV1().StatefulSets(workload.Namespace).Create(ctx, statefulSet, metav1.CreateOptions{})
	case "DaemonSet":
		daemonSet := createDaemonSet(workload)
		_, err = clientset.AppsV1().DaemonSets(workload.Namespace).Create(ctx, daemonSet, metav1.CreateOptions{})
	default:
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "不支持的工作负载类型"})
		return
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 保存工作负载信息到数据库
	if err := w.DB.Create(&workload).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, workload)
}

// GetWorkload godoc
// @Summary      获取工作负载详情
// @Description  根据集群ID、类型、命名空间和名称获取工作负载详情
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        clusterId path int true "集群ID"
// @Param        kind path string true "工作负载类型"
// @Param        namespace path string true "命名空间"
// @Param        name path string true "工作负载名称"
// @Success      200 {object} models.Workload "获取成功"
// @Failure      404 {object} map[string]string "工作负载不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{clusterId}/workloads/{kind}/{namespace}/{name} [get]
func (w *WorkloadController) GetWorkload(ctx *gin.Context) {
	clusterId, _ := strconv.Atoi(ctx.Param("clusterId"))
	kind := ctx.Param("kind")
	namespace := ctx.Param("namespace")
	name := ctx.Param("name")

	var workload models.Workload
	if err := w.DB.Where("cluster_id = ? AND kind = ? AND namespace = ? AND name = ?", clusterId, kind, namespace, name).First(&workload).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "工作负载不存在"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取集群信息
	var cluster models.Cluster
	if err := w.DB.First(&cluster, workload.ClusterID).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取工作负载状态
	clientset, err := utils.GetKubernetesClient(cluster.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新工作负载状态
	switch workload.Kind {
	case "Deployment":
		deployment, err := clientset.AppsV1().Deployments(workload.Namespace).Get(ctx, workload.Name, metav1.GetOptions{})
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		workload.Status.DesiredReplicas = *deployment.Spec.Replicas
		workload.Status.CurrentReplicas = deployment.Status.Replicas
		workload.Status.ReadyReplicas = deployment.Status.ReadyReplicas
		// 其他工作负载类型的状态更新...
	}

	ctx.JSON(http.StatusOK, workload)
}

// ListWorkloads godoc
// @Summary      获取工作负载列表
// @Description  获取指定集群的工作负载列表，支持分页和筛选
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        clusterId path int true "集群ID"
// @Param        page query int false "页码" default(1)
// @Param        page_size query int false "每页数量" default(10)
// @Param        namespace query string false "命名空间"
// @Param        kind query string false "工作负载类型"
// @Success      200 {object} map[string]interface{} "获取成功"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{clusterId}/workloads [get]
func (w *WorkloadController) ListWorkloads(ctx *gin.Context) {
	clusterId, _ := strconv.Atoi(ctx.Param("clusterId"))
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "10"))
	offset := (page - 1) * pageSize

	// 构建查询条件
	query := w.DB.Model(&models.Workload{}).Where("cluster_id = ?", clusterId)

	// 支持按命名空间筛选
	if namespace := ctx.Query("namespace"); namespace != "" {
		query = query.Where("namespace = ?", namespace)
	}

	// 支持按工作负载类型筛选
	if kind := ctx.Query("kind"); kind != "" {
		query = query.Where("kind = ?", kind)
	}

	var workloads []models.Workload
	if err := query.Offset(offset).Limit(pageSize).Find(&workloads).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取总数
	var total int64
	query.Count(&total)

	ctx.JSON(http.StatusOK, gin.H{
		"data": workloads,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// CreateStatefulSet godoc
// @Summary      创建StatefulSet工作负载
// @Description  在指定集群和命名空间中创建新的StatefulSet
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        clusterId path int true "集群ID"
// @Param        namespace path string true "命名空间"
// @Param        statefulSet body models.Workload true "StatefulSet信息"
// @Success      201 {object} models.Workload "创建成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{clusterId}/workloads/statefulsets/{namespace} [post]
func (w *WorkloadController) CreateStatefulSet(ctx *gin.Context) {
	clusterId, _ := strconv.Atoi(ctx.Param("clusterId"))
	namespace := ctx.Param("namespace")

	var statefulSet models.Workload
	if err := ctx.ShouldBindJSON(&statefulSet); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置工作负载类型和基本信息
	statefulSet.Kind = "StatefulSet"
	statefulSet.ClusterID = uint(clusterId)
	statefulSet.Namespace = namespace

	// 获取集群信息
	var cluster models.Cluster
	if err := w.DB.First(&cluster, clusterId).Error; err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "集群不存在"})
		return
	}

	// 初始化并获取 Kubernetes 客户端
	if err := utils.InitKubernetesClient(cluster); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	statefulSetObj := createStatefulSet(statefulSet)
	clientset, err := utils.GetKubernetesClient(cluster.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = clientset.AppsV1().StatefulSets(statefulSet.Namespace).Create(ctx, statefulSetObj, metav1.CreateOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 保存工作负载信息到数据库
	if err := w.DB.Create(&statefulSet).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, statefulSet)
}

// CreateDaemonSet godoc
// @Summary      创建DaemonSet工作负载
// @Description  在指定集群和命名空间中创建新的DaemonSet
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        clusterId path int true "集群ID"
// @Param        namespace path string true "命名空间"
// @Param        daemonSet body models.Workload true "DaemonSet信息"
// @Success      201 {object} models.Workload "创建成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{clusterId}/workloads/daemonsets/{namespace} [post]
func (w *WorkloadController) CreateDaemonSet(ctx *gin.Context) {
	clusterId, _ := strconv.Atoi(ctx.Param("clusterId"))
	namespace := ctx.Param("namespace")

	var daemonSet models.Workload
	if err := ctx.ShouldBindJSON(&daemonSet); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置工作负载类型和基本信息
	daemonSet.Kind = "DaemonSet"
	daemonSet.ClusterID = uint(clusterId)
	daemonSet.Namespace = namespace

	// 获取集群信息
	var cluster models.Cluster
	if err := w.DB.First(&cluster, clusterId).Error; err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "集群不存在"})
		return
	}

	// 初始化并获取 Kubernetes 客户端
	if err := utils.InitKubernetesClient(cluster); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	daemonSetObj := createDaemonSet(daemonSet)
	clientset, err := utils.GetKubernetesClient(cluster.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = clientset.AppsV1().DaemonSets(daemonSet.Namespace).Create(ctx, daemonSetObj, metav1.CreateOptions{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 保存工作负载信息到数据库
	if err := w.DB.Create(&daemonSet).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, daemonSet)
}

// UpdateWorkload godoc
// @Summary      更新工作负载
// @Description  更新指定集群中的工作负载
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        clusterId path int true "集群ID"
// @Param        kind path string true "工作负载类型"
// @Param        namespace path string true "命名空间"
// @Param        name path string true "工作负载名称"
// @Param        workload body models.Workload true "更新的工作负载信息"
// @Success      200 {object} models.Workload "更新成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      404 {object} map[string]string "工作负载不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{clusterId}/workloads/{kind}/{namespace}/{name} [put]
func (w *WorkloadController) UpdateWorkload(ctx *gin.Context) {
	clusterId, _ := strconv.Atoi(ctx.Param("clusterId"))
	kind := ctx.Param("kind")
	namespace := ctx.Param("namespace")
	name := ctx.Param("name")

	var workload models.Workload
	if err := w.DB.Where("cluster_id = ? AND kind = ? AND namespace = ? AND name = ?", clusterId, kind, namespace, name).First(&workload).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "工作负载不存在"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := ctx.ShouldBindJSON(&workload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取集群信息
	var cluster models.Cluster
	if err := w.DB.First(&cluster, workload.ClusterID).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取工作负载状态
	clientset, err := utils.GetKubernetesClient(cluster.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	switch workload.Kind {
	case "Deployment":
		deployment := createDeployment(workload)
		_, err = clientset.AppsV1().Deployments(workload.Namespace).Update(ctx, deployment, metav1.UpdateOptions{})
	case "StatefulSet":
		statefulSet := createStatefulSet(workload)
		_, err = clientset.AppsV1().StatefulSets(workload.Namespace).Update(ctx, statefulSet, metav1.UpdateOptions{})
	case "DaemonSet":
		daemonSet := createDaemonSet(workload)
		_, err = clientset.AppsV1().DaemonSets(workload.Namespace).Update(ctx, daemonSet, metav1.UpdateOptions{})
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新数据库中的工作负载信息
	if err := w.DB.Save(&workload).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, workload)
}

// DeleteWorkload godoc
// @Summary      删除工作负载
// @Description  删除指定集群中的工作负载
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        clusterId path int true "集群ID"
// @Param        kind path string true "工作负载类型"
// @Param        namespace path string true "命名空间"
// @Param        name path string true "工作负载名称"
// @Success      200 {object} map[string]string "删除成功"
// @Failure      404 {object} map[string]string "工作负载不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{clusterId}/workloads/{kind}/{namespace}/{name} [delete]
func (w *WorkloadController) DeleteWorkload(ctx *gin.Context) {
	clusterId, _ := strconv.Atoi(ctx.Param("clusterId"))
	kind := ctx.Param("kind")
	namespace := ctx.Param("namespace")
	name := ctx.Param("name")

	var workload models.Workload
	if err := w.DB.Where("cluster_id = ? AND kind = ? AND namespace = ? AND name = ?", clusterId, kind, namespace, name).First(&workload).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "工作负载不存在"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取集群信息
	var cluster models.Cluster
	if err := w.DB.First(&cluster, workload.ClusterID).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 删除 Kubernetes 资源
	clientset, err := utils.GetKubernetesClient(cluster.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	switch workload.Kind {
	case "Deployment":
		err = clientset.AppsV1().Deployments(workload.Namespace).Delete(ctx, workload.Name, metav1.DeleteOptions{})
	case "StatefulSet":
		err = clientset.AppsV1().StatefulSets(workload.Namespace).Delete(ctx, workload.Name, metav1.DeleteOptions{})
	case "DaemonSet":
		err = clientset.AppsV1().DaemonSets(workload.Namespace).Delete(ctx, workload.Name, metav1.DeleteOptions{})
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 从数据库中删除工作负载记录
	if err := w.DB.Delete(&workload).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 清理客户端连接
	utils.RemoveKubernetesClient(cluster.ID)

	ctx.JSON(http.StatusOK, gin.H{"message": "工作负载删除成功"})
}

// 创建 Deployment 资源
func createDeployment(workload models.Workload) *appsv1.Deployment {
	replicas := workload.Replicas
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:        workload.Name,
			Namespace:   workload.Namespace,
			Labels:      workload.Labels,
			Annotations: workload.Annotations,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: workload.Labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: workload.Labels,
				},
				Spec: corev1.PodSpec{
					Containers: convertContainers(workload.Containers),
				},
			},
		},
	}
}

// 创建 StatefulSet 资源
func createStatefulSet(workload models.Workload) *appsv1.StatefulSet {
	replicas := workload.Replicas
	return &appsv1.StatefulSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:        workload.Name,
			Namespace:   workload.Namespace,
			Labels:      workload.Labels,
			Annotations: workload.Annotations,
		},
		Spec: appsv1.StatefulSetSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: workload.Labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: workload.Labels,
				},
				Spec: corev1.PodSpec{
					Containers: convertContainers(workload.Containers),
				},
			},
			ServiceName: workload.Name,
		},
	}
}

// 创建 DaemonSet 资源
func createDaemonSet(workload models.Workload) *appsv1.DaemonSet {
	return &appsv1.DaemonSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:        workload.Name,
			Namespace:   workload.Namespace,
			Labels:      workload.Labels,
			Annotations: workload.Annotations,
		},
		Spec: appsv1.DaemonSetSpec{
			Selector: &metav1.LabelSelector{
				MatchLabels: workload.Labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: workload.Labels,
				},
				Spec: corev1.PodSpec{
					Containers: convertContainers(workload.Containers),
				},
			},
		},
	}
}

// ScaleWorkload godoc
// @Summary      扩缩容工作负载
// @Description  调整指定集群中工作负载的副本数
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        clusterId path int true "集群ID"
// @Param        kind path string true "工作负载类型"
// @Param        namespace path string true "命名空间"
// @Param        name path string true "工作负载名称"
// @Param        replicas body map[string]int true "副本数"
// @Success      200 {object} models.Workload "扩缩容成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      404 {object} map[string]string "工作负载不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/clusters/{clusterId}/workloads/{kind}/{namespace}/{name}/scale [put]
func (w *WorkloadController) ScaleWorkload(ctx *gin.Context) {
	clusterId, _ := strconv.Atoi(ctx.Param("clusterId"))
	kind := ctx.Param("kind")
	namespace := ctx.Param("namespace")
	name := ctx.Param("name")

	var scaleReq struct {
		Replicas int `json:"replicas"`
	}

	if err := ctx.ShouldBindJSON(&scaleReq); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取集群信息
	var cluster models.Cluster
	if err := w.DB.First(&cluster, clusterId).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取工作负载状态
	clientset, err := utils.GetKubernetesClient(cluster.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 根据工作负载类型进行扩缩容
	switch kind {
	case "Deployment":
		deployment, err := clientset.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
		if err != nil {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "工作负载不存在"})
			return
		}
		replicas := int32(scaleReq.Replicas)
		deployment.Spec.Replicas = &replicas
		_, err = clientset.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	case "StatefulSet":
		statefulSet, err := clientset.AppsV1().StatefulSets(namespace).Get(ctx, name, metav1.GetOptions{})
		if err != nil {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "工作负载不存在"})
			return
		}
		replicas := int32(scaleReq.Replicas)
		statefulSet.Spec.Replicas = &replicas
		_, err = clientset.AppsV1().StatefulSets(namespace).Update(ctx, statefulSet, metav1.UpdateOptions{})
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	case "DaemonSet":
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "DaemonSet不支持扩缩容"})
		return
	default:
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "不支持的工作负载类型"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "扩缩容成功"})
}

// 转换容器配置
func convertContainers(containers []models.Container) []corev1.Container {
	var k8sContainers []corev1.Container
	for _, c := range containers {
		container := corev1.Container{
			Name:  c.Name,
			Image: c.Image,
			Resources: corev1.ResourceRequirements{
				Requests: convertResourceList(c.Requests),
				Limits:   convertResourceList(c.Limits),
			},
			Env:   convertEnvVars(c.Env),
			Ports: convertContainerPorts(c.Ports),
		}
		k8sContainers = append(k8sContainers, container)
	}
	return k8sContainers
}

// 转换资源配置
func convertResourceList(resources models.ResourceList) corev1.ResourceList {
	// 实现资源配置转换逻辑
	return corev1.ResourceList{}
}

// 转换环境变量
func convertEnvVars(envVars []models.EnvVar) []corev1.EnvVar {
	var k8sEnvVars []corev1.EnvVar
	for _, env := range envVars {
		k8sEnvVars = append(k8sEnvVars, corev1.EnvVar{
			Name:  env.Name,
			Value: env.Value,
		})
	}
	return k8sEnvVars
}

// 转换容器端口
func convertContainerPorts(ports []models.ContainerPort) []corev1.ContainerPort {
	var k8sPorts []corev1.ContainerPort
	for _, port := range ports {
		k8sPorts = append(k8sPorts, corev1.ContainerPort{
			Name:          port.Name,
			ContainerPort: port.ContainerPort,
			Protocol:      corev1.Protocol(port.Protocol),
		})
	}
	return k8sPorts
}
