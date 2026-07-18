package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ForceCloseInput struct {
	TotalCashActual int64 `json:"total_cash_actual" binding:"required,min=0"`
}

// GetActiveShifts godoc
// @Summary      Get all currently active/open shifts
// @Description  Retrieve a list of all cashier shifts that are still open across the store (Admin Only).
// @Tags         Admin - Shifts
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  map[string]interface{} "Successfully retrieved active shifts"
// @Router       /api/v1/admin/shifts/active [get]
func GetActiveShifts(c *gin.Context) {
	var openShifts []models.Shift

	if err := database.DB.Preload("User").Where("status = 'open'").Find(&openShifts).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil data shift aktif", err.Error())
		return
	}

	utils.OK(c, "Daftar shift aktif berhasil diambil", openShifts)
}

// ForceCloseShift godoc
// @Summary      Force close a hanging cashier shift
// @Description  Admin can force close a shift that was left open by a cashier, calculating discrepancy and recording an audit log.
// @Tags         Admin - Shifts
// @Accept       json
// @Produce      json
// @Param        id     path      int              true  "Shift ID"
// @Param        input  body      ForceCloseInput  true  "Actual Cash Data"
// @Security     BearerAuth
// @Success      200    {object}  map[string]interface{} "Shift successfully force-closed"
// @Router       /api/v1/admin/shifts/{id}/force-close [post]
func ForceCloseShift(c *gin.Context) {
	adminID, ok := utils.GetUserID(c)
	if !ok {
		utils.Fail(c, http.StatusUnauthorized, "Sesi tidak valid", "Admin ID tidak ditemukan")
		return
	}

	shiftIDParam := c.Param("id")
	shiftID, err := strconv.ParseUint(shiftIDParam, 10, 32)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "ID Shift tidak valid", "invalid shift id format")
		return
	}

	var shift models.Shift
	if err := database.DB.Where("id = ? AND status = 'open'", shiftID).First(&shift).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Shift tidak ditemukan atau sudah ditutup", "shift not found or already closed")
		return
	}

	var input ForceCloseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Format data tidak valid", err.Error())
		return
	}

	now := time.Now()
	realExpected := shift.TotalCashExpected - shift.TotalRefundedCash
	difference := input.TotalCashActual - realExpected

	errTx := database.DB.Transaction(func(tx *gorm.DB) error {
		shift.EndTime = &now
		shift.TotalCashActual = input.TotalCashActual
		shift.CashDifference = difference
		shift.Status = "closed"

		if err := tx.Save(&shift).Error; err != nil {
			return err
		}

		oldValueString := fmt.Sprintf("KasirID: %d, Status: open, Expected: %d", shift.UserID, realExpected)
		newValueString := fmt.Sprintf("FORCE_CLOSED BY ADMIN ID %d, Actual: %d, Diff: %d", adminID, input.TotalCashActual, difference)

		errLog := utils.RecordActivity(
			tx,
			adminID, 
			"FORCE_CLOSE_SHIFT",
			"shifts",
			shift.ID,
			oldValueString,
			newValueString,
			c.ClientIP(),
		)
		if errLog != nil {
			return errLog
		}

		return nil
	})

	if errTx != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal memproses penutupan paksa shift", errTx.Error())
		return
	}

	utils.OK(c, "Shift kasir berhasil ditutup paksa oleh Admin", shift)
}