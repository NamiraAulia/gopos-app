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
		}

		protected := v1.Group("/")
		protected.Use(middleware.AuthMiddleware)
		{
			protected.GET("/products", handlers.GetProducts)
			protected.POST("/products", handlers.AddProducts)
			protected.PUT("/products/:id", handlers.EditProducts)
			protected.DELETE("/products/:id", handlers.DeleteProducts)
			protected.POST("/products/import", middleware.RequireRole("admin"), handlers.ImportProductsCSV)
			protected.POST("/products/batch-import", middleware.RequireRole("admin"), handlers.BatchImportProducts)
			protected.GET("/products/barcodes", handlers.GetProductBarcodes)

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
			protected.GET("/members/:id/kasbon-history", handlers.GetMemberKasbonHistory)
			protected.POST("/members/:id/repay", handlers.ProcessRepayment)
			protected.GET("/kasbon/summary", handlers.GetKasbonSummary)

			protected.GET("/suppliers", handlers.GetSuppliers)
			protected.GET("/suppliers/schedule", handlers.GetTodaySchedule)
			protected.POST("/suppliers", handlers.CreateSupplier)
			protected.PUT("/suppliers/:id", handlers.EditSupplier)
			protected.DELETE("/suppliers/:id", handlers.DeleteSupplier)

			// Admin-only: user management
			adminOnly := protected.Group("/admin")
			adminOnly.Use(middleware.RequireRole("admin"))
			{
				adminOnly.POST("/users", handlers.CreateUser)
				adminOnly.GET("/users", handlers.GetUsers)
				adminOnly.PUT("/users/:id/deactivate", handlers.DeactivateUser)
				adminOnly.PUT("/users/:id/activate", handlers.ActivateUser)
				// adminOnly.PATCH("/users/:id/reset-password", handlers.ResetPassword)
				adminOnly.GET("/shifts/active", handlers.GetActiveShifts)
				adminOnly.POST("/shifts/:id/force-close", handlers.ForceCloseShift)
				adminOnly.GET("/alerts", handlers.GetSystemAlerts)
				adminOnly.GET("/audit-logs", handlers.GetAuditLogs)
			}
		}
	}
}
