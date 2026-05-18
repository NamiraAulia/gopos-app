package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"
)

func GetDashboardSummary(c *gin.Context) {
	var todayRevenue int64
	var monthRevenue int64
	var totalSales int64
	var recentTransactions []models.Transaction

	now := time.Now()
	
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	database.DB.Model(&models.Transaction{}).
		Where("created_at >= ? AND status IN (?, ?)", todayStart, "sukses", "completed").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&todayRevenue)

	database.DB.Model(&models.Transaction{}).
		Where("created_at >= ? AND status IN (?, ?)", monthStart, "sukses", "completed").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&monthRevenue)

	database.DB.Model(&models.Transaction{}).Count(&totalSales)
	database.DB.Order("created_at desc").Limit(5).Find(&recentTransactions)
	utils.OK(c, "Data ringkasan dashboard", gin.H{
		"today_revenue":       todayRevenue,
		"month_revenue":       monthRevenue,
		"total_sales":         totalSales,
		"recent_transactions": recentTransactions,
	})
}