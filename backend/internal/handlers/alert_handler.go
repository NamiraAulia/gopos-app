package handlers

import (
	"time"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// GetSystemAlerts godoc
// @Summary      Get proactive system alerts
// @Description  Retrieve low stock items, forgotten/hanging shifts, and severe cash discrepancies for admin dashboard.
// @Tags         Admin - Alerts
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  map[string]interface{} "Alerts successfully retrieved"
// @Router       /api/v1/admin/alerts [get]
func GetSystemAlerts(c *gin.Context) {
	type LowStockAlert struct {
		ID    uint   `json:"id"`
		Name  string `json:"name"`
		Stock int    `json:"stock"`
		Unit  string `json:"unit"`
	}
	var lowStocks []LowStockAlert
	database.DB.Model(&models.Product{}).
		Where("is_active = true AND stock <= ?", 1).
		Select("id, name, stock, unit").
		Find(&lowStocks)

	type OvertimeShiftAlert struct {
		ID        uint      `json:"id"`
		Username  string    `json:"username"`
		StartTime time.Time `json:"start_time"`
	}
	var overtimeShifts []OvertimeShiftAlert
	twelveHoursAgo := time.Now().Add(-12 * time.Hour)
	
	database.DB.Model(&models.Shift{}).
		Select("shifts.id, users.username, shifts.start_time").
		Joins("JOIN users ON shifts.user_id = users.id").
		Where("shifts.status = 'open' AND shifts.start_time < ?", twelveHoursAgo).
		Scan(&overtimeShifts)

	type SevereDiscrepancyAlert struct {
		ID             uint      `json:"id"`
		Username       string    `json:"username"`
		EndTime        time.Time `json:"end_time"`
		CashDifference int64     `json:"cash_difference"`
	}
	var badShifts []SevereDiscrepancyAlert
	database.DB.Model(&models.Shift{}).
		Select("shifts.id, users.username, shifts.end_time, shifts.cash_difference").
		Joins("JOIN users ON shifts.user_id = users.id").
		Where("shifts.status = 'closed' AND (shifts.cash_difference >= ? OR shifts.cash_difference <= ?)", 50000, -50000).
		Scan(&badShifts)

	utils.OK(c, "Alert sistem berhasil diperbarui", gin.H{
		"low_stock_alerts":        lowStocks,
		"overtime_shift_alerts":  overtimeShifts,
		"discrepancy_cash_alerts": badShifts,
	})
}