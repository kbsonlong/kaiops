package main

import (
	"k8s-dashboard/internal/handler"
	"k8s-dashboard/internal/service"
	"k8s-dashboard/pkg/db"
	"k8s-dashboard/pkg/k8s"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化 Kubernetes 客户端

	if err := k8s.GetClient(); err != nil {
		log.Fatalf("初始化 Kubernetes 客户端失败: %v", err)
	}

	// 初始化数据库
	if err := db.Init(&db.Config{
		Host:     "localhost",
		Port:     3306,
		User:     "root",
		Password: "123456",
		DBName:   "k8s_dashboard",
	}); err != nil {
		log.Fatalf("初始化数据库失败: %v", err)
	}

	// 创建 Gin 路由
	r := gin.Default()

	// 添加 CORS 中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 创建服务和处理器
	clusterService := service.NewClusterService(db.GetDB())
	clusterHandler := handler.NewClusterHandler(clusterService)

	// 注册路由
	clusterHandler.RegisterRoutes(r)

	// 注册路由
	// api := r.Group("/api")
	// {
	// 	// 集群资源
	// 	api.GET("/metrics", clusterHandler.GetClusterMetrics)
	// 	api.GET("/nodes", clusterHandler.GetNodes)
	// 	api.GET("/pods", clusterHandler.GetPods)
	// 	api.GET("/services", clusterHandler.GetServices)
	// 	api.GET("/events", clusterHandler.GetEvents)
	// }

	// 启动服务器
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}
