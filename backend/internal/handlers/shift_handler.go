package handlers

import (
	"fmt"
	"net/http"
	"time"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type OpenShiftInput struct {
	StartCash int64 `json:"start_cash" binding:"required,min=0"`
}

type CloseShiftInput struct {
	TotalCashActual int64 `json:"total_cash_actual" binding:"required,min=0"`
}

// OpenShift godoc
// @Summary      Open a new cashier shift
// @Description  Start a new shift for the authenticated cashier by recording the initial drawer cash
// @Tags         Shifts
// @Accept       json
// @Produce      json
// @Param        input  body     OpenShiftInput  true  "Initial Shift Data"
// @Security     BearerAuth
// @Success      201    {object} map[string]interface{} "Shift successfully opened"
// @Failure      400    {object} map[string]interface{} "Active shift already exists or invalid input"
// @Router       /api/v1/shifts/open [post]
func OpenShift(c *gin.Context) {
	rawUserID, _ := c.Get("user_id")
	userID := uint(rawUserID.(float64))

	var activeShift models.Shift
	err := database.DB.Where("user_id = ? AND status = 'open'", userID).First(&activeShift).Error
	if err == nil {
		utils.Fail(c, http.StatusBadRequest, "Gagal membuka shift", "Anda masih memiliki shift aktif yang belum ditutup")
		return
	}

	var input OpenShiftInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Format data tidak valid", err.Error())
		return
	}

	newShift := models.Shift{
		UserID:            userID,
		StartTime:         time.Now(),
		StartCash:         input.StartCash,
		TotalCashExpected: input.StartCash,
		Status:            "open",
	}

	if err := database.DB.Create(&newShift).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal membuka shift di database", err.Error())
		return
	}

	utils.OK(c, "Shift berhasil dibuka", newShift)
}

// CloseShift godoc
// @Summary      Close an active cashier shift
// @Description  End the current active shift, calculate total expected cash, and record physical cash discrepancy
// @Tags         Shifts
// @Accept       json
// @Produce      json
// @Param        input  body     CloseShiftInput  true  "Closing Shift Data"
// @Security     BearerAuth
// @Security     BearerAuth
// @Success      200    {object} map[string]interface{} "Shift successfully closed"
// @Failure      400    {object} map[string]interface{} "No active shift found"
// @Router       /api/v1/shifts/close [post]
func CloseShift(c *gin.Context) {
	rawUserID, _ := c.Get("user_id")
	userID := uint(rawUserID.(float64))

	var activeShift models.Shift
	if err := database.DB.Where("user_id = ? AND status = 'open'", userID).First(&activeShift).Error; err != nil {
		utils.Fail(c, http.StatusBadRequest, "Gagal menutup shift", "Tidak ada shift aktif yang ditemukan untuk akun Anda")
		return
	}

	var input CloseShiftInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Format data tidak valid", err.Error())
		return
	}

	now := time.Now()

	realExpected := activeShift.StartCash + activeShift.TotalCashExpected - activeShift.TotalRefundedCash

	activeShift.CashDifference = input.TotalCashActual - realExpected
	activeShift.Status = "closed"
	activeShift.EndTime = &now

	if err := database.DB.Save(&activeShift).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menyimpan penutupan shift", err.Error())
		return
	}

	oldValueString := fmt.Sprintf("Status: open, Expected: %d", activeShift.StartCash)
	newValueString := fmt.Sprintf("Status: closed, Actual: %d, Diff: %d", activeShift.TotalCashActual, activeShift.CashDifference)

	_ = utils.RecordActivity(
		database.DB,
		userID,
		"CLOSE_SHIFT",
		"shifts",
		activeShift.ID,
		oldValueString,
		newValueString,
		c.ClientIP(),
	)

	utils.OK(c, "Shift berhasil ditutup", activeShift)
}
