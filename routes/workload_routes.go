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
	workloadGroup := r.Group("/api/v1/workloads")
	{
		// 创建工作负载
		workloadGroup.POST("", workloadController.CreateWorkload)
		// 获取工作负载列表
		workloadGroup.GET("", workloadController.ListWorkloads)
		// 获取单个工作负载
		workloadGroup.GET("/:id", workloadController.GetWorkload)
		// 更新工作负载
		workloadGroup.PUT("/:id", workloadController.UpdateWorkload)
		// 删除工作负载
		workloadGroup.DELETE("/:id", workloadController.DeleteWorkload)
	}
}
