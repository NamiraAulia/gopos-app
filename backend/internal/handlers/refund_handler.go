package handlers

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RefundItemInput struct {
	ProductID   uint    `json:"product_id" binding:"required"`
	QtyRefunded float64 `json:"qty_refunded" binding:"required,gt=0"`
}

type RefundInput struct {
	Reason string            `json:"reason" binding:"required"`
	Items  []RefundItemInput `json:"items" binding:"required,min=1"`
}

// ProcessRefund godoc
// @Summary      Process a partial or full transaction refund
// @Description  Refund specific items from a completed transaction, restore stock, deduct shift cash, and log the action.
// @Tags         Transactions
// @Accept       json
// @Produce      json
// @Param        id     path      int          true  "Transaction ID"
// @Param        input  body      RefundInput  true  "Refund Data Payload"
// @Security     BearerAuth
// @Success      201    {object}  map[string]interface{} "Refund processed successfully"
// @Router       /api/v1/transactions/{id}/refund [post]
func ProcessRefund(c *gin.Context) {
	userID, ok := utils.GetUserID(c)
	if !ok {
		utils.Fail(c, http.StatusUnauthorized, "Sesi tidak valid", "User ID tidak ditemukan")
		return
	}

	var activeShift models.Shift
	if err := database.DB.Where("user_id = ? AND status = 'open'", userID).First(&activeShift).Error; err != nil {
		utils.Fail(c, http.StatusBadRequest, "Retur ditolak", "Anda harus membuka shift kasir terlebih dahulu untuk memproses retur")
		return
	}

	txIDParam := c.Param("id")
	txID, _ := strconv.ParseUint(txIDParam, 10, 32)

	var transaction models.Transaction
	if err := database.DB.Preload("Items").Where("id = ? AND status IN ('completed', 'partially_refunded')", txID).First(&transaction).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Transaksi tidak ditemukan atau tidak valid untuk retur", err.Error())
		return
	}

	var input RefundInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data input tidak valid", err.Error())
		return
	}

	txItemMap := make(map[uint]models.TransactionItem)
	for _, item := range transaction.Items {
		txItemMap[item.ProductID] = item
	}

	var totalRefundAmount int64

	errTx := database.DB.Transaction(func(tx *gorm.DB) error {
		var refundItems []models.RefundItem

		for _, reqItem := range input.Items {
			txItem, exist := txItemMap[reqItem.ProductID]
			if !exist {
				return fmt.Errorf("produk ID %d tidak ada dalam nota transaksi ini", reqItem.ProductID)
			}

			// Calculate original item quantity & unit price in smallest (eceran) units
			origSmallestQty := txItem.Qty
			unitPriceEceran := float64(txItem.UnitPrice)
			if txItem.UnitChoice == "big" && txItem.ConversionUsed > 0 {
				origSmallestQty = txItem.Qty * float64(txItem.ConversionUsed)
				unitPriceEceran = float64(txItem.UnitPrice) / float64(txItem.ConversionUsed)
			}

			// Convert requested refund Qty to smallest (eceran) units
			reqSmallestQty := reqItem.QtyRefunded
			if txItem.UnitChoice == "big" && txItem.ConversionUsed > 0 && reqItem.QtyRefunded <= txItem.Qty {
				reqSmallestQty = reqItem.QtyRefunded * float64(txItem.ConversionUsed)
			}

			var alreadyRefundedRaw float64
			errScan := tx.Model(&models.RefundItem{}).
				Joins("JOIN refunds ON refund_items.refund_id = refunds.id").
				Where("refunds.transaction_id = ? AND refund_items.product_id = ?", transaction.ID, reqItem.ProductID).
				Select("COALESCE(SUM(refund_items.qty_refunded), 0.0)").
				Row().Scan(&alreadyRefundedRaw)

			if errScan != nil {
				return errScan
			}

			alreadyRefundedSmallest := alreadyRefundedRaw
			if txItem.UnitChoice == "big" && txItem.ConversionUsed > 0 && alreadyRefundedRaw <= txItem.Qty {
				alreadyRefundedSmallest = alreadyRefundedRaw * float64(txItem.ConversionUsed)
			}

			if alreadyRefundedSmallest+reqSmallestQty > origSmallestQty {
				return fmt.Errorf("jumlah retur produk '%s' melampaui batas beli asli", txItem.ProductName)
			}

			// Calculate refund amount for this item in IDR
			itemRefundAmount := int64(math.Round(unitPriceEceran * reqSmallestQty))
			totalRefundAmount = totalRefundAmount + itemRefundAmount

			refundItems = append(refundItems, models.RefundItem{
				ProductID:    reqItem.ProductID,
				ProductName:  txItem.ProductName,
				QtyRefunded:  reqItem.QtyRefunded,
				RefundAmount: itemRefundAmount,
			})

			// Restore stock to database (in smallest units)
			var product models.Product
			if err := tx.Where("id = ?", reqItem.ProductID).First(&product).Error; err == nil {
				if err := tx.Model(&models.Product{}).Where("id = ?", product.ID).
					UpdateColumn("stock", gorm.Expr("stock + ?", reqSmallestQty)).Error; err != nil {
					return err
				}
			}
		}

		refundData := models.Refund{
			TransactionID: transaction.ID,
			UserID:        userID,
			Reason:        input.Reason,
			TotalRefunded: totalRefundAmount,
			Items:         refundItems,
		}

		if err := tx.Create(&refundData).Error; err != nil {
			return err
		}

		// Hanya perbarui total_refunded_cash pada shift jika transaksi asli menggunakan pembayaran TUNAI (cash).
		// Pembayaran non-tunai (QRIS, Transfer) tidak mempengaruhi saldo kas fisik di laci kasir.
		if strings.ToLower(transaction.PaymentMethod) == "cash" {
			if err := tx.Model(&models.Shift{}).
				Where("id = ?", activeShift.ID).
				UpdateColumn("total_refunded_cash", gorm.Expr("total_refunded_cash + ?", totalRefundAmount)).
				Error; err != nil {
				return err
			}
		}

		// Calculate total original vs total refunded in smallest (eceran) units across all items
		var totalOriginalSmallestQty float64 = 0
		var totalRefundedSmallestQty float64 = 0

		for _, item := range transaction.Items {
			itemOrigSmallest := item.Qty
			if item.UnitChoice == "big" && item.ConversionUsed > 0 {
				itemOrigSmallest = item.Qty * float64(item.ConversionUsed)
			}
			totalOriginalSmallestQty += itemOrigSmallest

			var refundedRaw float64
			_ = tx.Model(&models.RefundItem{}).
				Joins("JOIN refunds ON refund_items.refund_id = refunds.id").
				Where("refunds.transaction_id = ? AND refund_items.product_id = ?", transaction.ID, item.ProductID).
				Select("COALESCE(SUM(refund_items.qty_refunded), 0.0)").
				Row().Scan(&refundedRaw)

			refundedSmallest := refundedRaw
			if item.UnitChoice == "big" && item.ConversionUsed > 0 && refundedRaw <= item.Qty {
				refundedSmallest = refundedRaw * float64(item.ConversionUsed)
			}
			totalRefundedSmallestQty += refundedSmallest
		}

		newStatus := "partially_refunded"
		if totalRefundedSmallestQty >= totalOriginalSmallestQty {
			newStatus = "refunded"
		}

		if err := tx.Model(&models.Transaction{}).
			Where("id = ?", transaction.ID).
			Update("status", newStatus).
			Error; err != nil {
			return err
		}

		auditOld := fmt.Sprintf("TxCode: %s, TotalOrig: %d", transaction.TransactionCode, transaction.TotalAmount)
		auditNew := fmt.Sprintf("REFUND EXECUTED, RefundID: %d, CashDeducted: %d, Reason: %s", refundData.ID, totalRefundAmount, input.Reason)

		errLog := utils.RecordActivity(tx, userID, "PROCESS_REFUND", "refunds", refundData.ID, auditOld, auditNew, c.ClientIP())
		if errLog != nil {
			return errLog
		}

		return nil
	})

	if errTx != nil {
		utils.Fail(c, http.StatusBadRequest, "Proses retur gagal", errTx.Error())
		return
	}

	utils.OK(c, "Retur parsial berhasil diproses, stok dan laci kas diperbarui", gin.H{
		"transaction_id":  txID,
		"amount_refunded": totalRefundAmount,
	})
}
