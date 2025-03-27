package initializers

import (
	"log"

	"github.com/joho/godotenv"
)

func LoadEnvVariables() {
	err := godotenv.Load("/Users/zengshenglong/Code/GoWorkSpace/demos/demo01/.env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
}
