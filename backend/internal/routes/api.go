package routes

import (
	"gopos-backend/internal/handlers"
	"gopos-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
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
			protected.POST("/products/import", handlers.ImportProductsCSV)

			protected.POST("/checkout", handlers.Checkout)
			protected.GET("/transactions", handlers.GetTransactions)
			protected.POST("/expenses", handlers.AddExpense)
			protected.GET("/expenses", handlers.GetExpenses)
			protected.GET("/restock-suggestions", handlers.GetRestockSuggestions)
			protected.GET("/reports/summary", handlers.GetDashboardSummary)
			protected.GET("/transactions/:id/receipt", handlers.GetReceiptData)
			protected.GET("/transactions/:id", handlers.GetTransactionByID) 
			protected.POST("/transactions/:id/void", handlers.VoidTransaction)
			protected.POST("/transactions/:id/refund", handlers.ProcessRefund)
			protected.GET("/reports/gross-profit", handlers.GetGrossProfitReport)
			protected.GET("/shifts", handlers.GetShifts)
			protected.POST("/shifts/open", handlers.OpenShift)
			protected.POST("/shifts/close", handlers.CloseShift)
			protected.GET("/shifts/active", handlers.GetActiveShift)

			protected.GET("/members", handlers.GetMembers)
			protected.POST("/members", handlers.CreateMember)
			protected.PUT("/members/:id", handlers.EditMember)
			protected.DELETE("/members/:id", handlers.DeleteMember)

			// Admin-only: user management
			adminOnly := protected.Group("/admin")
			adminOnly.Use(middleware.RequireRole("admin"))
			{
				adminOnly.POST("/users", handlers.CreateUser)
				adminOnly.GET("/users", handlers.GetUsers)
				adminOnly.PUT("/users/:id/deactivate", handlers.DeactivateUser)
				adminOnly.PUT("/users/:id/activate", handlers.ActivateUser)
				adminOnly.POST("/products/import", handlers.ImportProductsCSV)
				adminOnly.GET("/shifts/active", handlers.GetActiveShifts)
				adminOnly.POST("/shifts/:id/force-close", handlers.ForceCloseShift)
				adminOnly.GET("/alerts", handlers.GetSystemAlerts)
				adminOnly.GET("/audit-logs", handlers.GetAuditLogs)
			}
		}
	}
}
