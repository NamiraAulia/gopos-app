package handlers

import (
	"net/http"
	"time"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func AddExpense(c *gin.Context) {
    var input models.Expense
    if err := c.ShouldBindJSON(&input); err != nil {
        utils.Fail(c, http.StatusBadRequest, "Data pengeluaran tidak valid", err.Error())
        return
    }

    
    userID, _ := c.Get("user_id")
    input.ID = uint(userID.(float64))
    input.CreatedAt = time.Now()
    database.DB.Create(&input)

    if err := database.DB.Create(&input).Error; err != nil {
        utils.Fail(c, http.StatusInternalServerError, "Gagal menyimpan pengeluaran", err.Error())
        return
    }

    utils.OK(c, "Pengeluaran berhasil dicatat", input)
}

func GetExpenses(c *gin.Context) {
    var expenses []models.Expense
    database.DB.Order("created_at desc").Find(&expenses)
    utils.OK(c, "Daftar pengeluaran", expenses)
}