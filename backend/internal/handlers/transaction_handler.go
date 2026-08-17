package handlers

import (
	"fmt"
	"math"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"
)

type IdempotencyRecord struct {
	Response  models.Transaction
	Timestamp time.Time
	mu        sync.Mutex
	completed bool
}

var processedIdempotencyKeys sync.Map // map[string]*IdempotencyRecord

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

	idempotencyKey := req.IdempotencyKey
	if idempotencyKey == "" {
		idempotencyKey = c.GetHeader("X-Idempotency-Key")
	}

	var rec *IdempotencyRecord
	if idempotencyKey != "" {
		val, _ := processedIdempotencyKeys.LoadOrStore(idempotencyKey, &IdempotencyRecord{})
		rec = val.(*IdempotencyRecord)

		rec.mu.Lock()
		if rec.completed {
			if time.Since(rec.Timestamp) < 10*time.Minute {
				rec.mu.Unlock()
				utils.OK(c, "Transaksi sudah pernah diproses", rec.Response)
				return
			}
		}
		defer rec.mu.Unlock()
	}

	req.PaymentMethod = strings.ToLower(req.PaymentMethod)
	if req.PaymentMethod != "cash" && req.PaymentMethod != "qris" && req.PaymentMethod != "transfer" && req.PaymentMethod != "kasbon" {
		utils.Fail(c, http.StatusBadRequest, "Metode pembayaran tidak valid", "payment_method harus 'cash', 'qris', 'transfer', atau 'kasbon'")
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
	var normalTotal int64
	var finalDiscount int64
	type itemCalc struct {
		unitPrice   int64
		qtyToDeduct float64
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

		normalPrice := int64(product.Price)
		if item.UnitChoice == "big" && product.Conversion > 0 {
			normalPrice = int64(product.PriceBig)
		}

		unitPrice := normalPrice
		qtyToDeduct := item.Qty

		if item.UnitChoice == "big" && product.Conversion > 0 {
			qtyToDeduct = item.Qty * float64(product.Conversion)
			if product.IsPromo && product.DiscountAmount > 0 {
				discounted := product.PriceBig - product.DiscountAmount
				if discounted < 0 {
					discounted = 0
				}
				unitPrice = int64(discounted)
			}
		} else {
			// Unit small / satuan eceran
			if req.MemberID != nil && product.PriceMember > 0 {
				unitPrice = int64(product.PriceMember)
			} else if product.IsPromo && product.DiscountAmount > 0 {
				discounted := product.Price - product.DiscountAmount
				if discounted < 0 {
					discounted = 0
				}
				unitPrice = int64(discounted)
			}
		}

		// Gunakan math.Round untuk mencegah truncation pecahan float desimal (misal: 0.3 kg x Rp 15.000)
		subtotal := int64(math.Round(float64(unitPrice) * item.Qty))
		preflightTotal += subtotal
		normalTotal += int64(math.Round(float64(normalPrice) * item.Qty))

		calcMap[item.ProductID] = itemCalc{
			unitPrice:   unitPrice,
			qtyToDeduct: qtyToDeduct,
			subtotal:    subtotal,
		}
	}

	netTotal, finalDiscount := CalculateNetTotalAndDiscount(normalTotal, preflightTotal, req.DiscountAmount)

	var kasbonMember models.Member
	var kasbonAmount int64
	if req.PaymentMethod == "kasbon" {
		if req.MemberID == nil || *req.MemberID == 0 {
			utils.Fail(c, http.StatusBadRequest, "Member tidak dipilih", "Transaksi kasbon wajib memilih pelanggan / member yang terdaftar")
			return
		}
		if err := database.DB.First(&kasbonMember, *req.MemberID).Error; err != nil {
			utils.Fail(c, http.StatusBadRequest, "Member tidak ditemukan", "Data member tidak valid")
			return
		}
		if !kasbonMember.IsActive {
			utils.Fail(c, http.StatusBadRequest, "Member tidak aktif", "Member yang dinonaktifkan tidak dapat mengambil kasbon")
			return
		}

		if req.AmountPaid < 0 {
			req.AmountPaid = 0
		}
		if req.AmountPaid > netTotal {
			req.AmountPaid = netTotal
		}
		kasbonAmount = netTotal - req.AmountPaid
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

		changeAmount := int64(0)
		if req.PaymentMethod == "cash" {
			changeAmount = req.AmountPaid - netTotal
		}

		transaction := models.Transaction{
			UserID:          userID,
			TransactionCode: generateTrxCode(),
			TotalAmount:     netTotal,
			PaymentMethod:   req.PaymentMethod,
			AmountPaid:      req.AmountPaid,
			ChangeAmount:    changeAmount,
			Status:          "completed",
			MemberID:        req.MemberID,
			DiscountAmount:  finalDiscount,
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

		switch req.PaymentMethod {
		case "cash":
			if err := tx.Model(&models.Shift{}).
				Where("user_id = ? AND status = 'open'", userID).
				UpdateColumn("total_cash_expected", gorm.Expr("total_cash_expected + ?", netTotal)).
				Error; err != nil {
				return err
			}
		case "kasbon":
			// Tambahkan DP Tunai ke shift kasir jika ada
			if req.AmountPaid > 0 {
				if err := tx.Model(&models.Shift{}).
					Where("user_id = ? AND status = 'open'", userID).
					UpdateColumn("total_cash_expected", gorm.Expr("total_cash_expected + ?", req.AmountPaid)).
					Error; err != nil {
					return err
				}
			}

			// Tambahkan utang ke member & catat DebtLog
			if kasbonAmount > 0 {
				now := time.Now()
				dueDate := now.AddDate(0, 0, 30) // Default 30 hari jatuh tempo

				if err := tx.Model(&models.Member{}).
					Where("id = ?", kasbonMember.ID).
					Updates(map[string]interface{}{
						"total_debt":   gorm.Expr("total_debt + ?", kasbonAmount),
						"last_debt_at": now,
					}).Error; err != nil {
					return err
				}

				newTotalDebt := kasbonMember.TotalDebt + kasbonAmount
				debtLog := models.DebtLog{
					MemberID:      kasbonMember.ID,
					TransactionID: &transaction.ID,
					Type:          "kasbon",
					Amount:        kasbonAmount,
					DownPayment:   req.AmountPaid,
					RemainingDebt: newTotalDebt,
					PaymentMethod: "kasbon",
					Notes:         fmt.Sprintf("Kasbon transaksi %s (Total: Rp %d, DP: Rp %d)", transaction.TransactionCode, netTotal, req.AmountPaid),
					UserID:        userID,
					CreatedAt:     now,
					DueDate:       &dueDate,
				}

				if err := tx.Create(&debtLog).Error; err != nil {
					return err
				}

				_ = utils.RecordActivity(tx, userID, "KASBON_CHECKOUT", "debt_logs", debtLog.ID, "",
					fmt.Sprintf("Member: %s (ID %d), Nominal Utang: %d, DP: %d, TrxCode: %s", kasbonMember.Name, kasbonMember.ID, kasbonAmount, req.AmountPaid, transaction.TransactionCode),
					c.ClientIP())
			}
		}

		// Audit log jika kasir mengubah/meng-override harga produk saat checkout berlangsung
		for _, item := range req.Items {
			product := productMap[item.ProductID]
			normalPrice := int64(product.Price)
			if item.UnitChoice == "big" && product.Conversion > 0 {
				normalPrice = int64(product.PriceBig)
			}
			if item.UnitPrice > 0 && item.UnitPrice != normalPrice {
				oldVal := fmt.Sprintf("Produk: %s (ID %d), Harga Normal: %d", product.Name, product.ID, normalPrice)
				newVal := fmt.Sprintf("Harga Kustom Kasir: %d, Qty: %v, TrxCode: %s", item.UnitPrice, item.Qty, transaction.TransactionCode)
				_ = utils.RecordActivity(tx, userID, "CUSTOM_PRICE_CHECKOUT", "transaction_items", product.ID, oldVal, newVal, c.ClientIP())
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
	if rec != nil {
		rec.completed = true
		rec.Response = createdTransaction
		rec.Timestamp = time.Now()
	}
	utils.OK(c, "Transaksi berhasil diselesaikan!", createdTransaction)
}

func generateTrxCode() string {
	return fmt.Sprintf("TRX-%s-%s",
		time.Now().Format("20060102"),
		uuid.New().String()[:8],
	)
}

// CalculateNetTotalAndDiscount menghitung total bayar bersih dan total diskon dengan guard agar netTotal tidak pernah negatif
func CalculateNetTotalAndDiscount(normalTotal, preflightTotal, reqDiscount int64) (netTotal int64, totalDiscount int64) {
	if reqDiscount < 0 {
		reqDiscount = 0
	}
	appliedManualDiscount := reqDiscount
	if appliedManualDiscount > preflightTotal {
		appliedManualDiscount = preflightTotal
	}

	netTotal = preflightTotal - appliedManualDiscount
	productDiscount := normalTotal - preflightTotal
	if productDiscount < 0 {
		productDiscount = 0
	}

	totalDiscount = productDiscount + appliedManualDiscount
	return netTotal, totalDiscount
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

	query := database.DB.Model(&models.Transaction{}).Select("transactions.id, transactions.transaction_code, transactions.user_id, transactions.total_amount, transactions.payment_method, transactions.amount_paid, transactions.change_amount, transactions.status, transactions.member_id, transactions.discount_amount, transactions.created_at")

	// Filters
	status := c.Query("status")
	if status != "" && status != "all" {
		query = query.Where("transactions.status = ?", status)
	}

	search := c.Query("search")
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Joins("LEFT JOIN users ON users.id = transactions.user_id").
			Joins("LEFT JOIN members ON members.id = transactions.member_id").
			Where("transactions.transaction_code LIKE ? OR users.name LIKE ? OR members.name LIKE ?", searchPattern, searchPattern, searchPattern)
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	if startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("transactions.created_at >= ?", t)
		}
	}
	if endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("transactions.created_at <= ?", t.AddDate(0, 0, 1).Add(-time.Second))
		}
	}

	query.Count(&total)

	err := query.Preload("Items").Preload("Member").Preload("User").
		Order("transactions.created_at desc").
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

	if transaction.Status != "completed" {
		utils.Fail(c, http.StatusBadRequest, "Hanya transaksi berstatus sukses (completed) yang belum diretur yang dapat dibatalkan", "invalid status for void")
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		for _, item := range transaction.Items {
			qtyToRestore := item.Qty
			if item.UnitChoice == "big" && item.ConversionUsed > 0 {
				qtyToRestore = item.Qty * float64(item.ConversionUsed)
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

		oldVal := fmt.Sprintf("TrxCode: %s, TotalAmount: %d, PaymentMethod: %s, Status: %s", transaction.TransactionCode, transaction.TotalAmount, transaction.PaymentMethod, transaction.Status)
		newVal := fmt.Sprintf("Status: voided, Pembatalan oleh UserID: %d", userID)
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
