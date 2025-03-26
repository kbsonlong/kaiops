package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/kbsonlong/kaiops/controllers"
	"gorm.io/gorm"
)

// SetupWorkloadRoutes 设置工作负载相关的路由
func SetupWorkloadRoutes(r *gin.Engine, db *gorm.DB) {
	workloadController := &controllers.WorkloadController{DB: db}

	// 工作负载API路由组
	workloadGroup := r.Group("/api/v1/clusters/:id/workloads")
	{
		// 获取工作负载列表
		workloadGroup.GET("", workloadController.ListWorkloads)

		// 获取特定工作负载详情
		workloadGroup.GET("/:kind/:namespace/:name", workloadController.GetWorkload)

		// 创建Deployment
		workloadGroup.POST("/deployments/:namespace", workloadController.CreateDeployment)
		// 创建StatefulSet
		workloadGroup.POST("/statefulsets/:namespace", workloadController.CreateStatefulSet)
		// 创建DaemonSet
		workloadGroup.POST("/daemonsets/:namespace", workloadController.CreateDaemonSet)

		// 更新工作负载
		workloadGroup.PUT("/:kind/:namespace/:name", workloadController.UpdateWorkload)
		// 删除工作负载
		workloadGroup.DELETE("/:kind/:namespace/:name", workloadController.DeleteWorkload)
		// 扩缩容
		workloadGroup.PUT("/:kind/:namespace/:name/scale", workloadController.ScaleWorkload)
	}
}
