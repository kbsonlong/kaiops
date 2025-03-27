package db

import (
	"fmt"
	"log"

	"k8s-dashboard/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var defaultDB *gorm.DB

// Config 数据库配置
type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
}

// Init 初始化数据库连接
func Init(cfg *Config) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("连接数据库失败: %v", err)
	}

	// 自动迁移数据库表结构
	if err := autoMigrate(db); err != nil {
		return fmt.Errorf("数据库迁移失败: %v", err)
	}

	defaultDB = db
	log.Println("数据库初始化成功")
	return nil
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return defaultDB
}

// autoMigrate 自动迁移数据库表结构
func autoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.Cluster{}, // 集群表
	)
}
