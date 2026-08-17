package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"
)

// GetKasbonSummary godoc
// @Summary      Get Kasbon receivables summary statistics
// @Tags         Kasbon
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Router       /api/v1/kasbon/summary [get]
func GetKasbonSummary(c *gin.Context) {
	var totalReceivables int64
	database.DB.Model(&models.Member{}).Where("is_active = true").Select("COALESCE(SUM(total_debt), 0)").Scan(&totalReceivables)

	var totalDebtors int64
	database.DB.Model(&models.Member{}).Where("is_active = true AND total_debt > 0").Count(&totalDebtors)

	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var overdueDebtors int64
	database.DB.Model(&models.Member{}).
		Where("is_active = true AND total_debt > 0 AND last_debt_at IS NOT NULL AND last_debt_at < ?", thirtyDaysAgo).
		Count(&overdueDebtors)

	utils.OK(c, "Ringkasan Kasbon", gin.H{
		"total_receivables": totalReceivables,
		"total_debtors":     totalDebtors,
		"overdue_debtors":   overdueDebtors,
	})
}

// GetMemberKasbonHistory godoc
// @Summary      Get debt & repayment timeline for a member
// @Tags         Kasbon
// @Param        id path int true "Member ID"
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Router       /api/v1/members/{id}/kasbon-history [get]
func GetMemberKasbonHistory(c *gin.Context) {
	memberID := c.Param("id")

	var member models.Member
	if err := database.DB.First(&member, memberID).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Member tidak ditemukan", err.Error())
		return
	}

	var logs []models.DebtLog
	if err := database.DB.Preload("User").Preload("Transaction").
		Where("member_id = ?", member.ID).
		Order("id desc").
		Find(&logs).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil riwayat kasbon", err.Error())
		return
	}

	isOverdue := false
	if member.TotalDebt > 0 && member.LastDebtAt != nil {
		if member.LastDebtAt.Before(time.Now().AddDate(0, 0, -30)) {
			isOverdue = true
		}
	}

	utils.OK(c, "Riwayat kasbon member", gin.H{
		"member":     member,
		"is_overdue": isOverdue,
		"logs":       logs,
	})
}

// ProcessRepayment godoc
// @Summary      Process debt repayment / cicilan for a member
// @Tags         Kasbon
// @Accept       json
// @Produce      json
// @Param        id path int true "Member ID"
// @Param        payload body models.RepayInput true "Repayment details"
// @Success      200 {object} map[string]interface{}
// @Router       /api/v1/members/{id}/repay [post]
func ProcessRepayment(c *gin.Context) {
	memberID := c.Param("id")

	var input models.RepayInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	input.PaymentMethod = strings.ToLower(input.PaymentMethod)
	if input.PaymentMethod != "cash" && input.PaymentMethod != "qris" && input.PaymentMethod != "transfer" {
		utils.Fail(c, http.StatusBadRequest, "Metode pembayaran tidak valid", "payment_method harus 'cash', 'qris', atau 'transfer'")
		return
	}

	userID, ok := utils.GetUserID(c)
	if !ok {
		utils.Fail(c, http.StatusUnauthorized, "Sesi tidak valid", "User ID tidak ditemukan")
		return
	}

	var member models.Member
	if err := database.DB.First(&member, memberID).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Member tidak ditemukan", err.Error())
		return
	}

	if member.TotalDebt <= 0 {
		utils.Fail(c, http.StatusBadRequest, "Member tidak memiliki utang", "Total utang member saat ini adalah Rp 0")
		return
	}

	if input.AmountPaid > member.TotalDebt {
		utils.Fail(c, http.StatusBadRequest,
			fmt.Sprintf("Nominal pembayaran (Rp %d) melebihi total utang member (Rp %d)", input.AmountPaid, member.TotalDebt),
			"amount_paid exceeds total_debt")
		return
	}

	var createdLog models.DebtLog
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		newTotalDebt := member.TotalDebt - input.AmountPaid

		if err := tx.Model(&member).Update("total_debt", newTotalDebt).Error; err != nil {
			return err
		}
		member.TotalDebt = newTotalDebt

		notes := input.Notes
		if notes == "" {
			if newTotalDebt == 0 {
				notes = "Pelunasan Utang Kasbon (LUNAS)"
			} else {
				notes = fmt.Sprintf("Pembayaran Cicilan Utang Kasbon (Sisa Utang: Rp %d)", newTotalDebt)
			}
		}

		logEntry := models.DebtLog{
			MemberID:      member.ID,
			Type:          "repayment",
			Amount:        input.AmountPaid,
			RemainingDebt: newTotalDebt,
			PaymentMethod: input.PaymentMethod,
			Notes:         notes,
			UserID:        userID,
			CreatedAt:     time.Now(),
		}

		if err := tx.Create(&logEntry).Error; err != nil {
			return err
		}

		// Jika pembayaran cicilan dilakukan dengan TUNAI (Cash), tambahkan saldo kas laci shift aktif jika ada
		if input.PaymentMethod == "cash" {
			var activeShift models.Shift
			if err := tx.Where("user_id = ? AND status = 'open'", userID).First(&activeShift).Error; err == nil {
				if err := tx.Model(&activeShift).UpdateColumn("total_cash_expected", gorm.Expr("total_cash_expected + ?", input.AmountPaid)).Error; err != nil {
					return err
				}
			}
		}

		oldVal := fmt.Sprintf("Member: %s (ID %d), TotalUtangAwal: %d", member.Name, member.ID, member.TotalDebt+input.AmountPaid)
		newVal := fmt.Sprintf("PembayaranCicilan: %d, Metode: %s, TotalUtangSisa: %d", input.AmountPaid, input.PaymentMethod, newTotalDebt)
		_ = utils.RecordActivity(tx, userID, "REPAY_KASBON", "debt_logs", logEntry.ID, oldVal, newVal, c.ClientIP())

		createdLog = logEntry
		return nil
	})

	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal memproses pembayaran kasbon", err.Error())
		return
	}

	database.DB.Preload("User").First(&createdLog, createdLog.ID)

	utils.OK(c, "Pembayaran kasbon berhasil diproses!", gin.H{
		"member":   member,
		"debt_log": createdLog,
	})
}
