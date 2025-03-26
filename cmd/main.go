package main

import (
	"github.com/gin-gonic/gin"
	docs "github.com/kbsonlong/kaiops/docs"
	"github.com/kbsonlong/kaiops/initializers"
	"github.com/kbsonlong/kaiops/middlewares"
	"github.com/kbsonlong/kaiops/routes"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func init() {
	initializers.LoadEnvVariables()
	initializers.ConnectDB()
}

func main() {
	docs.SwaggerInfo.Title = "KaiOPS API"
	docs.SwaggerInfo.Description = "这是一个用于管理 Kubernetes 集群的 API 服务"
	docs.SwaggerInfo.Version = "1.0"
	docs.SwaggerInfo.Host = "localhost:3000"
	docs.SwaggerInfo.BasePath = "/"
	docs.SwaggerInfo.Schemes = []string{"http", "https"}

	r := gin.Default()
	r.Use(middlewares.Cors())
	r.Use(gin.Logger())

	// Swagger 文档路由
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Cluster Routes
	routes.SetupClusterRoutes(r, initializers.DB)

	// Workload Routes
	routes.SetupWorkloadRoutes(r, initializers.DB)

	r.Run()
}
