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

// CreateWorkload godoc
// @Summary      创建工作负载
// @Description  在指定集群中创建新的工作负载
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        workload body models.Workload true "工作负载信息"
// @Success      201 {object} models.Workload "创建成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/workloads [post]
func (w *WorkloadController) CreateWorkload(ctx *gin.Context) {
	var workload models.Workload
	if err := ctx.ShouldBindJSON(&workload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取集群信息
	var cluster models.Cluster
	if err := w.DB.First(&cluster, workload.ClusterID).Error; err != nil {
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
// @Description  根据ID获取工作负载的详细信息
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        id path int true "工作负载ID"
// @Success      200 {object} models.Workload "获取成功"
// @Failure      404 {object} map[string]string "工作负载不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/workloads/{id} [get]
func (w *WorkloadController) GetWorkload(ctx *gin.Context) {
	id := ctx.Param("id")
	var workload models.Workload

	if err := w.DB.First(&workload, id).Error; err != nil {
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
// @Description  获取所有工作负载的列表，支持分页和筛选
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        page query int false "页码" default(1)
// @Param        page_size query int false "每页数量" default(10)
// @Param        cluster_id query int false "集群ID"
// @Param        namespace query string false "命名空间"
// @Param        kind query string false "工作负载类型"
// @Success      200 {object} map[string]interface{} "获取成功"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/workloads [get]
func (w *WorkloadController) ListWorkloads(ctx *gin.Context) {
	var workloads []models.Workload
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "10"))
	offset := (page - 1) * pageSize

	// 构建查询条件
	query := w.DB.Model(&models.Workload{})

	// 支持按集群ID筛选
	if clusterID := ctx.Query("cluster_id"); clusterID != "" {
		query = query.Where("cluster_id = ?", clusterID)
	}

	// 支持按命名空间筛选
	if namespace := ctx.Query("namespace"); namespace != "" {
		query = query.Where("namespace = ?", namespace)
	}

	// 支持按工作负载类型筛选
	if kind := ctx.Query("kind"); kind != "" {
		query = query.Where("kind = ?", kind)
	}

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

// UpdateWorkload godoc
// @Summary      更新工作负载
// @Description  根据ID更新工作负载的配置
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        id path int true "工作负载ID"
// @Param        workload body models.Workload true "更新的工作负载信息"
// @Success      200 {object} models.Workload "更新成功"
// @Failure      400 {object} map[string]string "请求参数错误"
// @Failure      404 {object} map[string]string "工作负载不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/workloads/{id} [put]
func (w *WorkloadController) UpdateWorkload(ctx *gin.Context) {
	id := ctx.Param("id")
	var workload models.Workload

	if err := w.DB.First(&workload, id).Error; err != nil {
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
// @Description  根据ID删除指定的工作负载
// @Tags         workloads
// @Accept       json
// @Produce      json
// @Param        id path int true "工作负载ID"
// @Success      200 {object} map[string]string "删除成功"
// @Failure      404 {object} map[string]string "工作负载不存在"
// @Failure      500 {object} map[string]string "服务器内部错误"
// @Router       /api/v1/workloads/{id} [delete]
func (w *WorkloadController) DeleteWorkload(ctx *gin.Context) {
	id := ctx.Param("id")
	var workload models.Workload

	if err := w.DB.First(&workload, id).Error; err != nil {
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
