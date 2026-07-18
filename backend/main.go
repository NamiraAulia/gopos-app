package main

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"gopos-backend/docs"
	"gopos-backend/internal/database"
	"gopos-backend/internal/routes"

	_ "gopos-backend/docs"
)

// @title GoPOS API
// @version 1.0
// @description API for GoPOS Backend
// @host localhost:8080
// @BasePath        /api/v1
// @securityDefinitions.apikey BearerAuth
// @in                         header
// @name                       Authorization

func main() {
	docs.SwaggerInfo.BasePath = "/"

	err := godotenv.Load()
	if err != nil {
		log.Println("Peringatan: File .env tidak ditemukan, menggunakan environment default")
	}

	database.ConnectDB()
	database.SeedAdmin()
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Static("/uploads", "./uploads")

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	routes.SetupRoutes(r)

	r.Run(":8080")
}
