package initializers

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	var err error
	log.Println("Connecting to database...")
	log.Println(os.Getenv("DB_URL"))
	dsn := os.Getenv("DB_URL")
	fmt.Println(dsn)

	// 配置 GORM 以正确处理 JSON 类型
	config := &gorm.Config{
		PrepareStmt: true,
		// 添加 JSON 类型处理
		DisableForeignKeyConstraintWhenMigrating: true,
		// 使用 JSON 类型
		CreateBatchSize: 100,
	}

	DB, err = gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		log.Fatal("Failed to connect to database!")
	}

	// 获取底层的 *sql.DB 对象
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("Failed to get database instance!")
	}

	// 设置连接池
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
}
