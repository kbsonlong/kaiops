package routes

import (
	"github.com/kbsonlong/kaiops/controllers"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupClusterRoutes(r *gin.Engine, db *gorm.DB) {
	clusterController := &controllers.ClusterController{DB: db}

	// 集群管理路由组
	clusterGroup := r.Group("/api/v1/clusters")
	{
		// 创建集群
		clusterGroup.POST("", clusterController.CreateCluster)

		// 获取集群列表
		clusterGroup.GET("", clusterController.ListClusters)

		// 获取单个集群
		clusterGroup.GET("/:id", clusterController.GetCluster)

		// 更新集群
		clusterGroup.PUT("/:id", clusterController.UpdateCluster)

		// 删除集群
		clusterGroup.DELETE("/:id", clusterController.DeleteCluster)

		// 获取集群节点状态
		clusterGroup.GET("/:id/nodes", clusterController.GetClusterNodes)

		clusterGroup.PATCH(":id/nodes/:nodeName/labels", clusterController.UpdateNodeLabels)
		clusterGroup.DELETE(":id/nodes/:nodeName/labels/:labelKey", clusterController.DeleteNodeLabel)
		clusterGroup.PATCH(":id/nodes/:nodeName/taints", clusterController.UpdateNodeTaints)
		clusterGroup.DELETE(":id/nodes/:nodeName/taints/:taintKey", clusterController.DeleteNodeTaint)
	}
}
