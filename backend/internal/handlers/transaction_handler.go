package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"
)

func Checkout(c *gin.Context) {
	var req models.CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	productIDs := make([]uint, 0, len(req.Items))
	for _, item := range req.Items {
		productIDs = append(productIDs, item.ProductID)
	}

	var products []models.Product
	if err := database.DB.Where("id IN ? AND is_active = true", productIDs).Find(&products).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal ambil data produk", err.Error())
		return
	}
	productMap := make(map[uint]models.Product, len(products))
	for _, p := range products {
		productMap[p.ID] = p
	}

	for _, item := range req.Items {
		if _, ok := productMap[item.ProductID]; !ok {
			utils.Fail(c, http.StatusBadRequest,
				fmt.Sprintf("Produk ID %d tidak ditemukan", item.ProductID), "product not found")
			return
		}
	}

	var createdTransaction models.Transaction

	err := database.DB.Transaction(func(tx *gorm.DB) error {

		var totalAmount int64

		txItems := make([]models.TransactionItem, 0, len(req.Items))

		for _, item := range req.Items {
			product := productMap[item.ProductID]

			subtotal := int64(product.Price) * int64(item.Qty)
			totalAmount += subtotal

			txItems = append(txItems, models.TransactionItem{
				ProductID:   product.ID,
				ProductName: product.Name,
				UnitPrice:   int64(product.Price),
				Qty:         item.Qty,
				Subtotal:    subtotal,
			})
		}

		if req.AmountPaid < totalAmount {
			return fmt.Errorf(
				"uang diterima (Rp %d) kurang dari total (Rp %d)",
				req.AmountPaid, totalAmount,
			)
		}

		changeAmount := req.AmountPaid - totalAmount

		userID, _ := c.Get("user_id")
		transaction := models.Transaction{
			UserID:          userID.(uint), 
			TransactionCode: generateTrxCode(),
			TotalAmount:     totalAmount,
			PaymentMethod:   req.PaymentMethod,
			AmountPaid:      req.AmountPaid,
			ChangeAmount:    changeAmount,
			Status:          "completed",
			CreatedAt:       time.Now(),
		}

		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		for i := range txItems {
			txItems[i].TransactionID = transaction.ID
		}

		if err := tx.Create(&txItems).Error; err != nil {
			return err
		}

		for _, item := range req.Items {
			if err := tx.Model(&models.Product{}).
				Where("id = ?", item.ProductID).
				UpdateColumn("stock", gorm.Expr("stock - ?", item.Qty)).
				Error; err != nil {
				return err
			}
		}

		transaction.Items = txItems
		createdTransaction = transaction
		return nil
	})

	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error(), err.Error())
		return
	}

	database.DB.Preload("Items").First(&createdTransaction, createdTransaction.ID)
	utils.OK(c, "Transaksi berhasil!", createdTransaction)
}

func generateTrxCode() string {
    return fmt.Sprintf("TRX-%s-%s",
        time.Now().Format("20060102"),
        uuid.New().String()[:8],
    )
}

func GetTransactions(c *gin.Context) {
	page, limit, offset := utils.GetPagination(c)

	var transactions []models.Transaction
	var total int64

	database.DB.Model(&models.Transaction{}).Count(&total)

	err := database.DB.Preload("Items").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error

	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil data transaksi", err.Error())
		return
	}

	utils.OK(c, "Daftar transaksi berhasil diambil", gin.H{
		"data":        transactions,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

func GetTransactionByID(c *gin.Context) {
	id := c.Param("id")
	var transaction models.Transaction
	if err := database.DB.Preload("Items").First(&transaction, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Transaksi tidak ditemukan", err.Error())
		return
	}
	utils.OK(c, "Detail transaksi", transaction)
}
