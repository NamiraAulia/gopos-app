package handlers

import (
	"net/http"
	"time"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AddExpense godoc
// @Summary      Record a new expense
// @Description  Create a new business expense entry linked to the logged-in user
// @Tags         Expenses
// @Accept       json
// @Produce      json
// @Param        expense  body      models.Expense  true  "Expense Ledger Data"
// @Success      201      {object}  map[string]interface{} "Expense successfully recorded"
// @Failure      400      {object}  map[string]interface{} "Invalid data input syntax"
// @Failure      500      {object}  map[string]interface{} "Database error saving ledger entry"
// @Router       /api/v1/expenses [post]
func AddExpense(c *gin.Context) {
	var input models.AddExpenseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data pengeluaran tidak valid", err.Error())
		return
	}

	userID, ok := utils.GetUserID(c)
	if !ok {
		utils.Fail(c, http.StatusUnauthorized, "Sesi tidak valid", "User ID tidak ditemukan")
		return
	}

	tx := database.DB.Begin()

	expense := models.Expense{
		UserID:    userID,
		Name:      input.Name,
		Amount:    input.Amount,
		Category:  input.Category,
		CreatedAt: time.Now(),
	}

	if err := tx.Create(&expense).Error; err != nil {
		tx.Rollback()
		utils.Fail(c, http.StatusInternalServerError, "Gagal menyimpan pengeluaran", err.Error())
		return
	}

	// Update expected shift cash if open shift exists
	var activeShift models.Shift
	if err := tx.Where("user_id = ? AND status = 'open'", userID).First(&activeShift).Error; err == nil {
		if err := tx.Model(&activeShift).UpdateColumn("total_cash_expected", gorm.Expr("total_cash_expected - ?", input.Amount)).Error; err != nil {
			tx.Rollback()
			utils.Fail(c, http.StatusInternalServerError, "Gagal memperbarui kas shift", err.Error())
			return
		}
	}

	tx.Commit()
	utils.OK(c, "Pengeluaran berhasil dicatat", expense)
}


// GetExpenses godoc
// @Summary      Retrieve list of expenses
// @Description  Get all historical business expense data sorted by newest creation time
// @Tags         Expenses
// @Produce      json
// @Success      200      {object}  map[string]interface{} "Successfully fetched expense records"
// @Router       /api/v1/expenses [get]

func GetExpenses(c *gin.Context) {
	page, limit, offset := utils.GetPagination(c)

	var expenses []models.Expense
	var total int64

	database.DB.Model(&models.Expense{}).Count(&total)

	if err := database.DB.Preload("User").Order("created_at desc").Limit(limit).Offset(offset).Find(&expenses).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil data pengeluaran", err.Error())
		return
	}

	utils.OK(c, "Daftar pengeluaran", gin.H{
		"data":        expenses,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}
