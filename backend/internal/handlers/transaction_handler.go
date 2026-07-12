package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"
)

// Checkout godoc
// @Summary      Process a point-of-sale checkout transaction
// @Description  Deduct item stocks atomically, calculate product pricing sums, calculate cash change, and log transaction items
// @Tags         Transactions
// @Accept       json
// @Produce      json
// @Param        order  body      models.CheckoutRequest  true  "Checkout Basket Details"
// @Success      200    {object}  map[string]interface{} "Checkout finalized successfully"
// @Failure      400    {object}  map[string]interface{} "Insufficient cash payment amount or non-existent product ids"
// @Router       /api/v1/transactions/checkout [post]

func Checkout(c *gin.Context) {
	var req models.CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	req.PaymentMethod = strings.ToLower(req.PaymentMethod)
	if req.PaymentMethod != "cash" && req.PaymentMethod != "qris" && req.PaymentMethod != "transfer" {
		utils.Fail(c, http.StatusBadRequest, "Metode pembayaran tidak valid", "payment_method harus 'cash', 'qris', atau 'transfer'")
		return
	}

	userID, ok := utils.GetUserID(c)
	if !ok {
		utils.Fail(c, http.StatusUnauthorized, "Sesi tidak valid", "User ID tidak ditemukan")
		return
	}

	var activeShift models.Shift
	if err := database.DB.Where("user_id = ? AND status = 'open'", userID).First(&activeShift).Error; err != nil {
		utils.Fail(c, http.StatusBadRequest, "Transaksi ditolak", "Anda harus membuka shift kasir terlebih dahulu sebelum melayani transaksi")
		return
	}

	productIDs := make([]uint, 0, len(req.Items))
	for _, item := range req.Items {
		productIDs = append(productIDs, item.ProductID)
	}

	var products []models.Product
	if err := database.DB.Where("id IN ? AND is_active = true", productIDs).Find(&products).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil data produk", err.Error())
		return
	}

	productMap := make(map[uint]models.Product, len(products))
	for _, p := range products {
		productMap[p.ID] = p
	}

	var preflightTotal int64
	type itemCalc struct {
		unitPrice   int64
		qtyToDeduct int
		subtotal    int64
	}
	calcMap := make(map[uint]itemCalc, len(req.Items))

	for _, item := range req.Items {
		product, ok := productMap[item.ProductID]
		if !ok {
			utils.Fail(c, http.StatusBadRequest,
				fmt.Sprintf("Produk ID %d tidak ditemukan atau tidak aktif", item.ProductID),
				"product not found")
			return
		}

		qtyInBaseUnit := item.Qty
		if item.UnitChoice == "big" && product.Conversion > 0 {
			qtyInBaseUnit = item.Qty * product.Conversion
		}

		if product.Stock < qtyInBaseUnit {
			utils.Fail(c, http.StatusBadRequest,
				fmt.Sprintf("Stok produk '%s' tidak cukup (tersedia: %d %s, diminta setara: %d %s)",
					product.Name, product.Stock, product.Unit, qtyInBaseUnit, product.Unit),
				"insufficient stock")
			return
		}

		unitPrice := int64(product.Price)
		qtyToDeduct := item.Qty

		if item.UnitChoice == "big" && product.Conversion > 0 {
			unitPrice = int64(product.PriceBig)
			qtyToDeduct = item.Qty * product.Conversion

			if product.IsPromo && product.DiscountAmount > 0 {
				discounted := product.PriceBig - product.DiscountAmount
				if discounted < 0 {
					discounted = 0
				}
				unitPrice = int64(discounted)
			}
		} else {
			// Unit small / satuan eceran
			if product.IsPromo && product.DiscountAmount > 0 {
				discounted := product.Price - product.DiscountAmount
				if discounted < 0 {
					discounted = 0
				}
				unitPrice = int64(discounted)
			}
		}

		subtotal := unitPrice * int64(item.Qty)
		preflightTotal += subtotal
		calcMap[item.ProductID] = itemCalc{
			unitPrice:   unitPrice,
			qtyToDeduct: qtyToDeduct,
			subtotal:    subtotal,
		}
	}

	netTotal := preflightTotal - req.DiscountAmount
	if netTotal < 0 {
		netTotal = 0
	}

	if req.PaymentMethod == "cash" && req.AmountPaid < netTotal {
		utils.Fail(c, http.StatusBadRequest,
			fmt.Sprintf("Uang diterima (Rp %d) kurang dari total belanja (Rp %d)", req.AmountPaid, netTotal),
			"insufficient payment")
		return
	}

	if req.PaymentMethod == "qris" || req.PaymentMethod == "transfer" {
		req.AmountPaid = netTotal
	}

	var createdTransaction models.Transaction
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		txItems := make([]models.TransactionItem, 0, len(req.Items))

		for _, item := range req.Items {
			product := productMap[item.ProductID]
			calc := calcMap[item.ProductID]

			txItems = append(txItems, models.TransactionItem{
				ProductID:      product.ID,
				ProductName:    product.Name,
				UnitPrice:      calc.unitPrice,
				Qty:            item.Qty,
				Subtotal:       calc.subtotal,
				ConversionUsed: product.Conversion,
				UnitChoice:     item.UnitChoice,
			})

			if err := tx.Model(&models.Product{}).
				Where("id = ?", product.ID).
				UpdateColumn("stock", gorm.Expr("stock - ?", calc.qtyToDeduct)).
				Error; err != nil {
				return err
			}
		}

		changeAmount := req.AmountPaid - netTotal

		transaction := models.Transaction{
			UserID:          userID,
			TransactionCode: generateTrxCode(),
			TotalAmount:     netTotal,
			PaymentMethod:   req.PaymentMethod,
			AmountPaid:      req.AmountPaid,
			ChangeAmount:    changeAmount,
			Status:          "completed",
			MemberID:        req.MemberID,
			DiscountAmount:  req.DiscountAmount,
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

		if req.PaymentMethod == "cash" {
			if err := tx.Model(&models.Shift{}).
				Where("user_id = ? AND status = 'open'", userID).
				UpdateColumn("total_cash_expected", gorm.Expr("total_cash_expected + ?", netTotal)).
				Error; err != nil {
				return err
			}
		}

		transaction.Items = txItems
		createdTransaction = transaction
		return nil
	})

	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Transaksi gagal diproses", err.Error())
		return
	}

	database.DB.Preload("Items").Preload("Member").Preload("User").First(&createdTransaction, createdTransaction.ID)
	utils.OK(c, "Transaksi berhasil diselesaikan!", createdTransaction)
}

func generateTrxCode() string {
	return fmt.Sprintf("TRX-%s-%s",
		time.Now().Format("20060102"),
		uuid.New().String()[:8],
	)
}

// GetTransactions godoc
// @Summary      Get list of transactions
// @Description  Fetch a historical data view of invoice logs with standard offset pagination parameters
// @Tags         Transactions
// @Produce      json
// @Param        page   query     int  false  "Page target number"
// @Param        limit  query     int  false  "Max capacity per page response window"
// @Success      200    {object}  map[string]interface{} "Successfully returned transaction lists"
// @Failure      500    {object}  map[string]interface{} "Database mapping reading error"
// @Router       /api/v1/transactions [get]
func GetTransactions(c *gin.Context) {
	page, limit, offset := utils.GetPagination(c)

	var transactions []models.Transaction
	var total int64

	database.DB.Model(&models.Transaction{}).Count(&total)

	err := database.DB.Preload("Items").Preload("Member").Preload("User").
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

// GetTransactionByID godoc
// @Summary      Get invoice detail sheet
// @Description  Fetch all purchase rows and overall financial totals of a transaction by its numeric unique key identifier
// @Tags         Transactions
// @Produce      json
// @Param        id   path      int  true  "Numeric Internal Transaction Database ID"
// @Success      200  {object}  map[string]interface{} "Target database row matched and loaded"
// @Failure      404  {object}  map[string]interface{} "Invoice not found matching specific identifier"
// @Router       /api/v1/transactions/{id} [get]
func GetTransactionByID(c *gin.Context) {
	id := c.Param("id")
	var transaction models.Transaction
	if err := database.DB.Preload("Items").Preload("Member").Preload("User").First(&transaction, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Transaksi tidak ditemukan", err.Error())
		return
	}
	utils.OK(c, "Detail transaksi", transaction)
}

func VoidTransaction(c *gin.Context) {
	id := c.Param("id")

	userID, ok := utils.GetUserID(c)
	if !ok {
		utils.Fail(c, http.StatusUnauthorized, "Sesi tidak valid", "User ID tidak ditemukan")
		return
	}

	var transaction models.Transaction
	if err := database.DB.Preload("Items").Preload("Member").Preload("User").First(&transaction, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Transaksi tidak ditemukan", err.Error())
		return
	}

	if transaction.Status == "voided" {
		utils.Fail(c, http.StatusBadRequest, "Transaksi sudah dibatalkan sebelumnya", "already voided")
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		for _, item := range transaction.Items {
			qtyToRestore := item.Qty
			if item.UnitChoice == "big" && item.ConversionUsed > 0 {
				qtyToRestore = item.Qty * item.ConversionUsed
			}
			if err := tx.Model(&models.Product{}).
				Where("id = ?", item.ProductID).
				UpdateColumn("stock", gorm.Expr("stock + ?", qtyToRestore)).
				Error; err != nil {
				return err
			}
		}

		// Update shift refund total if active shift exists and payment is cash
		if strings.ToLower(transaction.PaymentMethod) == "cash" {
			var activeShift models.Shift
			if err := tx.Where("user_id = ? AND status = 'open'", transaction.UserID).First(&activeShift).Error; err == nil {
				if err := tx.Model(&activeShift).UpdateColumn("total_refunded_cash", gorm.Expr("total_refunded_cash + ?", transaction.TotalAmount)).Error; err != nil {
					return err
				}
			}
		}

		if err := tx.Model(&transaction).Update("status", "voided").Error; err != nil {
			return err
		}

		oldVal := fmt.Sprintf("Status: %s, TotalAmount: %d", transaction.Status, transaction.TotalAmount)
		newVal := "Status: voided"
		errLog := utils.RecordActivity(tx, userID, "VOID_TRANSACTION", "transactions", transaction.ID, oldVal, newVal, c.ClientIP())
		if errLog != nil {
			return errLog
		}

		return nil
	})

	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal membatalkan transaksi", err.Error())
		return
	}

	utils.OK(c, "Transaksi berhasil dibatalkan dan stok dikembalikan", transaction)
}
