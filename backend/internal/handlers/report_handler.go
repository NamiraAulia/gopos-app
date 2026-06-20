package handlers

import (
	"net/http"
	"time"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// GetDashboardSummary godoc
// @Summary      Get financial summary for analytics dashboard
// @Description  Retrieve structured statistics including daily revenue, monthly revenue, total sales count, and the 5 most recent transactions
// @Tags         Reports & Dashboard
// @Produce      json
// @Success      200      {object}  map[string]interface{} "Dashboard data loaded successfully"
// @Router       /api/v1/reports/dashboard-summary [get]
func GetDashboardSummary(c *gin.Context) {
	var todayRevenue, monthRevenue int64
	var totalSales int64
	var recentTransactions []models.Transaction

	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	database.DB.Model(&models.Transaction{}).
		Where("created_at >= ? AND status = ?", todayStart, "completed").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&todayRevenue)

	database.DB.Model(&models.Transaction{}).
		Where("created_at >= ? AND status = ?", monthStart, "completed").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&monthRevenue)

	database.DB.Model(&models.Transaction{}).
		Where("status = ?", "completed").
		Count(&totalSales)

	database.DB.Preload("Items").
		Where("status = ?", "completed").
		Order("created_at desc").
		Limit(5).
		Find(&recentTransactions)

	utils.OK(c, "Data ringkasan dashboard", gin.H{
		"today_revenue":       todayRevenue,
		"month_revenue":       monthRevenue,
		"total_sales":         totalSales,
		"recent_transactions": recentTransactions,
	})
}

func GetSalesReport(c *gin.Context) {
	startStr := c.Query("start_date")
	endStr := c.Query("end_date")

	now := time.Now()
	startDate := now.AddDate(0, 0, -30)
	endDate := now

	var err error
	if startStr != "" {
		startDate, err = time.ParseInLocation("2006-01-02", startStr, now.Location())
		if err != nil {
			utils.Fail(c, http.StatusBadRequest, "Format start_date tidak valid, gunakan YYYY-MM-DD", err.Error())
			return
		}
	}
	if endStr != "" {
		endDate, err = time.ParseInLocation("2006-01-02", endStr, now.Location())
		if err != nil {
			utils.Fail(c, http.StatusBadRequest, "Format end_date tidak valid, gunakan YYYY-MM-DD", err.Error())
			return
		}
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 0, endDate.Location())
	}

	type Summary struct {
		TotalRevenue     int64 `json:"total_revenue"`
		TotalTransaction int64 `json:"total_transaction"`
		TotalItemsSold   int64 `json:"total_items_sold"`
	}
	var summary Summary

	database.DB.Model(&models.Transaction{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "completed").
		Select("COALESCE(SUM(total_amount), 0) as total_revenue, COUNT(*) as total_transaction").
		Scan(&summary)

	database.DB.Model(&models.TransactionItem{}).
		Joins("JOIN transactions ON transactions.id = transaction_items.transaction_id").
		Where("transactions.created_at BETWEEN ? AND ? AND transactions.status = ?", startDate, endDate, "completed").
		Select("COALESCE(SUM(transaction_items.qty), 0) as total_items_sold").
		Scan(&summary)

	type DailySales struct {
		Date    string `json:"date"`
		Revenue int64  `json:"revenue"`
		Count   int64  `json:"count"`
	}
	var dailySales []DailySales

	database.DB.Model(&models.Transaction{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "completed").
		Select("DATE(created_at) as date, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as count").
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&dailySales)

	type TopProduct struct {
		ProductID   uint   `json:"product_id"`
		ProductName string `json:"product_name"`
		TotalQty    int64  `json:"total_qty"`
		TotalRevenue int64 `json:"total_revenue"`
	}
	var topProducts []TopProduct

	database.DB.Model(&models.TransactionItem{}).
		Joins("JOIN transactions ON transactions.id = transaction_items.transaction_id").
		Where("transactions.created_at BETWEEN ? AND ? AND transactions.status = ?", startDate, endDate, "completed").
		Select("transaction_items.product_id, transaction_items.product_name, SUM(transaction_items.qty) as total_qty, SUM(transaction_items.subtotal) as total_revenue").
		Group("transaction_items.product_id, transaction_items.product_name").
		Order("total_qty DESC").
		Limit(10).
		Scan(&topProducts)

	type PaymentBreakdown struct {
		Method  string `json:"method"`
		Count   int64  `json:"count"`
		Revenue int64  `json:"revenue"`
	}
	var paymentBreakdown []PaymentBreakdown

	database.DB.Model(&models.Transaction{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "completed").
		Select("payment_method as method, COUNT(*) as count, SUM(total_amount) as revenue").
		Group("payment_method").
		Scan(&paymentBreakdown)

	utils.OK(c, "Laporan penjualan", gin.H{
		"period": gin.H{
			"start_date": startDate.Format("2006-01-02"),
			"end_date":   endDate.Format("2006-01-02"),
		},
		"summary":           summary,
		"daily_sales":       dailySales,
		"top_products":      topProducts,
		"payment_breakdown": paymentBreakdown,
	})
}

func GetExpenseReport(c *gin.Context) {
	startStr := c.Query("start_date")
	endStr := c.Query("end_date")

	now := time.Now()
	startDate := now.AddDate(0, 0, -30)
	endDate := now

	var err error
	if startStr != "" {
		startDate, err = time.ParseInLocation("2006-01-02", startStr, now.Location())
		if err != nil {
			utils.Fail(c, http.StatusBadRequest, "Format start_date tidak valid", err.Error())
			return
		}
	}
	if endStr != "" {
		endDate, err = time.ParseInLocation("2006-01-02", endStr, now.Location())
		if err != nil {
			utils.Fail(c, http.StatusBadRequest, "Format end_date tidak valid", err.Error())
			return
		}
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 0, endDate.Location())
	}

	var totalExpense int64
	database.DB.Model(&models.Expense{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalExpense)

	type CategoryBreakdown struct {
		Category string `json:"category"`
		Total    int64  `json:"total"`
		Count    int64  `json:"count"`
	}
	var categoryBreakdown []CategoryBreakdown

	database.DB.Model(&models.Expense{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Select("category, SUM(amount) as total, COUNT(*) as count").
		Group("category").
		Order("total DESC").
		Scan(&categoryBreakdown)

	var expenses []models.Expense
	database.DB.Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Order("created_at DESC").
		Find(&expenses)

	utils.OK(c, "Laporan pengeluaran", gin.H{
		"period": gin.H{
			"start_date": startDate.Format("2006-01-02"),
			"end_date":   endDate.Format("2006-01-02"),
		},
		"total_expense":      totalExpense,
		"category_breakdown": categoryBreakdown,
		"expenses":           expenses,
	})
}

// GetGrossProfitReport godoc
// @Summary      Get Gross Profit Report
// @Description  Retrieve summary and product breakdown of gross profit within a specific date range
// @Tags         Reports
// @Produce      json
// @Param        start_date  query    string  false  "Start date in YYYY-MM-DD format (default: today)"
// @Param        end_date    query    string  false  "End date in YYYY-MM-DD format (default: today)"
// @Security     BearerAuth
// @Success      200         {object} map[string]interface{} "Successfully retrieved gross profit report"
// @Failure      500         {object} map[string]interface{} "Internal server error"
// @Router       /api/v1/reports/gross-profit [get]
func GetGrossProfitReport(c *gin.Context) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	now := time.Now()
	todayStr := now.Format("2006-01-02")

	if startDateStr == "" {
		startDateStr = todayStr
	}
	if endDateStr == "" {
		endDateStr = todayStr
	}

	startDateTime := startDateStr + " 00:00:00"
	endDateTime := endDateStr + " 23:59:59"

	type ReportSummary struct {
		TotalRevenue int64 `json:"total_revenue"`
		TotalCogs    int64 `json:"total_cogs"`
		GrossProfit  int64 `json:"gross_profit"`
	}

	var summary ReportSummary

	summaryQuery := `
		SELECT 
			COALESCE(SUM(ti.subtotal), 0) as total_revenue,
			COALESCE(SUM(p.best_price * ti.qty), 0) as total_cogs,
			COALESCE(SUM(ti.subtotal) - SUM(p.best_price * ti.qty), 0) as gross_profit
		FROM transaction_items ti
		JOIN transactions t ON ti.transaction_id = t.id
		JOIN products p ON ti.product_id = p.id
		WHERE t.status = 'completed' AND t.created_at BETWEEN ? AND ?
	`

	if err := database.DB.Raw(summaryQuery, startDateTime, endDateTime).Scan(&summary).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menghitung ringkasan laporan", err.Error())
		return
	}

	type ProductProfitBreakdown struct {
		ProductID   uint   `json:"product_id"`
		ProductName string `json:"product_name"`
		QtySold     int    `json:"qty_sold"`
		Revenue     int64  `json:"revenue"`
		Cogs        int64  `json:"cogs"`
		Profit      int64  `json:"profit"`
	}

	var productsBreakdown []ProductProfitBreakdown

	breakdownQuery := `
		SELECT 
			p.id as product_id,
			ti.product_name as product_name,
			SUM(ti.qty) as qty_sold,
			SUM(ti.subtotal) as revenue,
			SUM(p.best_price * ti.qty) as cogs,
			SUM(ti.subtotal) - SUM(p.best_price * ti.qty) as profit
		FROM transaction_items ti
		JOIN transactions t ON ti.transaction_id = t.id
		JOIN products p ON ti.product_id = p.id
		WHERE t.status = 'completed' AND t.created_at BETWEEN ? AND ?
		GROUP BY p.id, ti.product_name
		ORDER BY profit DESC
	`

	if err := database.DB.Raw(breakdownQuery, startDateTime, endDateTime).Scan(&productsBreakdown).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menghitung rincian laporan per produk", err.Error())
		return
	}

	utils.OK(c, "Laporan laba kotor berhasil diambil", gin.H{
		"start_date":    startDateStr,
		"end_date":      endDateStr,
		"total_revenue": summary.TotalRevenue,
		"total_cogs":    summary.TotalCogs,
		"gross_profit":  summary.GrossProfit,
		"products":      productsBreakdown,
	})
}