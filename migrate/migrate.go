package main

import (
	"github.com/kbsonlong/kaiops/initializers"
	"github.com/kbsonlong/kaiops/models"
)

func init() {
	initializers.LoadEnvVariables()
	initializers.ConnectDB()
}

func main() {
	initializers.DB.AutoMigrate(&models.Cluster{})
}
