package handlers

import (
	"net/http"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func GetReceiptData(c *gin.Context) {
	id := c.Param("id")

	var transaction models.Transaction

	if err := database.DB.Preload("Items").Where("id = ?", id).First(&transaction).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Transaksi tidak ditemukan", "transaction not found")
		return
	}

	type ReceiptItemResponse struct {
		ProductName string `json:"product_name"`
		Qty         int    `json:"qty"`
		UnitPrice   int64  `json:"unit_price"`
		Subtotal    int64  `json:"subtotal"`
	}

	var itemsResponse []ReceiptItemResponse
	for _, item := range transaction.Items {
		itemsResponse = append(itemsResponse, ReceiptItemResponse{
			ProductName: item.ProductName,
			Qty:         item.Qty,
			UnitPrice:   item.UnitPrice,
			Subtotal:    item.Subtotal,
		})
	}

	utils.OK(c, "Data struk berhasil dibuat", gin.H{
		"store_name":       "GoPOS Toko Sembako",
		"transaction_code": transaction.TransactionCode,
		"date":             transaction.CreatedAt.Format("2006-01-02 15:04:05"),
		"payment_method":   transaction.PaymentMethod,
		"cashier_id":       transaction.UserID,
		"items":            itemsResponse,
		"total_amount":     transaction.TotalAmount,
		"amount_paid":      transaction.AmountPaid,
		"change_amount":    transaction.ChangeAmount,
		"footer_message":   "Terima Kasih Telah Berbelanja!",
	})
}