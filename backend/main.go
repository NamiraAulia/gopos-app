package main

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"gopos-backend/internal/database"
	"gopos-backend/internal/handlers"
	"gopos-backend/internal/middleware"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Peringatan: File .env tidak ditemukan, menggunakan environment default")
	}

	database.ConnectDB()
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // Hanya izinkan Next.js
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Static("/uploads", "./uploads")

	// /api/v1 routes
	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/login", handlers.Login)
			auth.POST("/register", handlers.CreateUser)
		}

		protected := v1.Group("/")
		protected.Use(middleware.AuthMiddleware)
		{
			protected.GET("/products", handlers.GetProducts)
			protected.POST("/products", handlers.AddProducts)
			protected.PUT("/products/:id", handlers.EditProducts)
			protected.DELETE("/products/:id", handlers.DeleteProducts)

			protected.POST("/checkout", handlers.Checkout)
			protected.GET("/transactions", handlers.GetTransactions)
			protected.POST("/expenses", handlers.AddExpense)
			protected.GET("/expenses", handlers.GetExpenses)
			protected.GET("/restock-suggestions", handlers.GetRestockSuggestions)
			protected.GET("/reports/summary", handlers.GetDashboardSummary)

			// Admin-only: user management
			adminOnly := protected.Group("/")
			adminOnly.Use(middleware.RequireRole("admin"))
			{
				adminOnly.POST("/users", handlers.CreateUser)
				adminOnly.GET("/users", handlers.GetUsers)
				adminOnly.PUT("/users/:id/deactivate", handlers.DeactivateUser)
				adminOnly.PUT("/users/:id/activate", handlers.ActivateUser)
			}
		}
	}

	r.Run(":8080")
}
