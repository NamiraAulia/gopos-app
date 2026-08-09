package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AddProductPayload struct {
	Name           string  `json:"name" binding:"required"`
	Barcode        string  `json:"barcode"`
	BestPrice      int     `json:"best_price" binding:"required"`
	Price          int     `json:"price" binding:"required"`
	PriceBig       int     `json:"price_big"`
	Stock          float64 `json:"stock"`
	Unit           string  `json:"unit" binding:"required"`
	UnitBig        string  `json:"unit_big"`
	Conversion     int     `json:"conversion"`
	UnitChoice     string  `json:"unit_choice"`
	SupplierName   string  `json:"supplier_name"`
	DiscountAmount int     `json:"discount_amount"`
	IsPromo        bool    `json:"is_promo"`
	PriceMember    int     `json:"price_member"`
}

// GetProducts godoc
// @Summary      Get list of products
// @Description  Retrieve a paginated list of active products with optional search filters
// @Tags         Products
// @Produce      json
// @Param        name     query    string  false  "Search by product name"
// @Param        barcode  query    string  false  "Search by exact barcode"
// @Param        page     query    int     false  "Page number for pagination"
// @Param        limit    query    int     false  "Number of items per page"
// @Success      200      {object} map[string]interface{} "Successfully retrieved products"
// @Failure      500      {object} map[string]interface{} "Internal server error"
// @Router       /api/v1/products [get]
func GetProducts(c *gin.Context) {
	searchQuery := c.Query("name")
	if searchQuery == "" {
		searchQuery = c.Query("search")
	}
	barcode := c.Query("barcode")

	page, limit, offset := utils.GetPagination(c)

	var products []models.Product

	query := database.DB.Where("is_active = ?", true)

	if barcode != "" {
		query = query.Where("barcode = ?", barcode)
	} else if searchQuery != "" {
		query = query.Where("name LIKE ? OR barcode LIKE ?", "%"+searchQuery+"%", searchQuery)
	}

	var total int64
	query.Model(&models.Product{}).Count(&total)

	if err := query.Limit(limit).Offset(offset).Find(&products).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil data produk", err.Error())
		return
	}

	utils.OK(c, "Data produk berhasil diambil", gin.H{
		"products": products,
		"page":     page,
		"limit":    limit,
		"total":    total,
	})
}

// AddProducts godoc
// @Summary      Create a new product
// @Description  Add a new product entry into the store database
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        product  body     models.Product  true  "Product Registration Data"
// @Success      201      {object} map[string]interface{} "Product successfully created"
// @Failure      400      {object} map[string]interface{} "Invalid input format or missing fields"
// @Failure      500      {object} map[string]interface{} "Database error saving product"
// @Router       /api/v1/products [post]
func AddProducts(c *gin.Context) {
	var input AddProductPayload

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format data tidak valid", "error": err.Error()})
		return
	}

	if input.Price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Harga produk harus lebih dari 0"})
		return
	}

	finalStock := input.Stock
	if input.UnitChoice == "big" && input.Conversion > 0 {
		finalStock = input.Stock * float64(input.Conversion)
	}

	product := models.Product{
		Name:           input.Name,
		Barcode:        input.Barcode,
		BestPrice:      input.BestPrice,
		Price:          input.Price,
		PriceBig:       input.PriceBig,
		Stock:          finalStock,
		Unit:           input.Unit,
		UnitBig:        input.UnitBig,
		Conversion:     input.Conversion,
		SupplierName:   input.SupplierName,
		IsActive:       true,
		DiscountAmount: input.DiscountAmount,
		IsPromo:        input.IsPromo,
		PriceMember:    input.PriceMember,
	}

	if errDB := database.DB.Create(&product).Error; errDB != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan produk ke database", "error": errDB.Error()})
		return
	}

	response := utils.Success("Produk berhasil ditambahkan", product)
	c.JSON(http.StatusCreated, response)
}

// EditProducts godoc
// @Summary      Update an existing product
// @Description  Modify product details such as name, price, stock, and barcode by its ID
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        id       path     int             true  "Product ID"
// @Param        product  body     models.Product  true  "Updated Product Object"
// @Success      200      {object} map[string]interface{} "Product successfully updated"
// @Failure      400      {object} map[string]interface{} "Invalid JSON payload"
// @Failure      404      {object} map[string]interface{} "Product not found"
// @Failure      500      {object} map[string]interface{} "Database error updating product"
// @Router       /api/v1/products/{id} [put]
func EditProducts(c *gin.Context) {
	id := c.Param("id")
	var input models.Product

	if err := c.ShouldBindJSON(&input); err != nil {
		response := utils.Error("Data tidak valid", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	userID, ok := utils.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Sesi tidak valid"})
		return
	}

	var product models.Product
	if err := database.DB.First(&product, id).Error; err != nil {
		response := utils.Error("Barang tidak ditemukan!", err.Error())
		c.JSON(http.StatusNotFound, response)
		return
	}

	oldPrice := product.Price
	oldStock := product.Stock

	product.Name = input.Name
	product.Barcode = input.Barcode
	product.BestPrice = input.BestPrice
	product.Price = input.Price
	product.Stock = input.Stock
	product.SupplierName = input.SupplierName
	product.Unit = input.Unit
	product.PriceBig = input.PriceBig
	product.UnitBig = input.UnitBig
	product.Conversion = input.Conversion
	product.DiscountAmount = input.DiscountAmount
	product.IsPromo = input.IsPromo
	product.PriceMember = input.PriceMember

	if err := database.DB.Save(&product).Error; err != nil {
		response := utils.Error("Gagal mengupdate barang di database", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	if oldPrice != input.Price {
		oldVal := fmt.Sprintf("Price: %d", oldPrice)
		newVal := fmt.Sprintf("Price: %d", input.Price)
		_ = utils.RecordActivity(nil, userID, "CHANGE_PRICE", "products", product.ID, oldVal, newVal, c.ClientIP())
	}
	if oldStock != input.Stock {
		oldVal := fmt.Sprintf("Stock: %v", oldStock)
		newVal := fmt.Sprintf("Stock: %v", input.Stock)
		_ = utils.RecordActivity(nil, userID, "MANUAL_STOCK_ADJUST", "products", product.ID, oldVal, newVal, c.ClientIP())
	}
	if oldPrice == input.Price && oldStock == input.Stock {
		oldVal := fmt.Sprintf("Name: %s, Price: %d, Stock: %v", product.Name, product.Price, product.Stock)
		newVal := fmt.Sprintf("Name: %s, Price: %d, Stock: %v", input.Name, input.Price, input.Stock)
		_ = utils.RecordActivity(nil, userID, "EDIT_PRODUCT", "products", product.ID, oldVal, newVal, c.ClientIP())
	}

	response := utils.Success("Barang berhasil diupdate!", product)
	c.JSON(http.StatusOK, response)
}

// DeleteProducts godoc
// @Summary      Soft delete a product
// @Description  Deactivate a product by setting its active status to false instead of hard deleting
// @Tags         Products
// @Produce      json
// @Param        id   path     int  true  "Product ID"
// @Success      200  {object} map[string]interface{} "Product successfully deactivated"
// @Failure      404  {object} map[string]interface{} "Product not found"
// @Router       /api/v1/products/{id} [delete]
func DeleteProducts(c *gin.Context) {
	id := c.Param("id")

	userID, ok := utils.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Sesi tidak valid"})
		return
	}

	var product models.Product
	if err := database.DB.First(&product, id).Error; err != nil {
		response := utils.Error("Barang tidak ditemukan!", err.Error())
		c.JSON(http.StatusNotFound, response)
		return
	}

	if err := database.DB.Model(&product).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menghapus produk"})
		return
	}

	oldVal := "IsActive: true"
	newVal := "IsActive: false"
	_ = utils.RecordActivity(nil, userID, "DELETE_PRODUCT", "products", product.ID, oldVal, newVal, c.ClientIP())

	response := utils.Success("Barang berhasil dihapus!", product)
	c.JSON(http.StatusOK, response)
}

// GetRestockSuggestions godoc
// @Summary      Get low stock and high demand suggestions
// @Description  Calculate average sales from the last 7 days and predict items needing urgent restocking
// @Tags         Products
// @Produce      json
// @Success      200  {object} map[string]interface{} "Successfully calculated restock suggestions"
// @Failure      500  {object} map[string]interface{} "Failed to compute sales algorithms"
// @Router       /api/v1/products/restock-suggestions [get]
func GetRestockSuggestions(c *gin.Context) {
	var rawSuggestions []struct {
		ProductID      uint       `json:"product_id"`
		ProductName    string     `json:"product_name"`
		CurrentStock   float64    `json:"current_stock"`
		AvgSalesPerDay float64    `json:"avg_sales_per_day"`
		DaysRemaining  float64    `json:"days_remaining"`
		SupplierName   string     `json:"supplier_name"`
		Conversion     int        `json:"conversion"`
		Unit           string     `json:"unit"`
		UnitBig        string     `json:"unit_big"`
		ShelfLifeDays  int        `json:"shelf_life_days"`
		ExpiryDate     *time.Time `json:"expiry_date"`
	}

	sevenDaysAgo := time.Now().AddDate(0, 0, -7)

	query := `
		SELECT 
			p.id as product_id, 
			p.name as product_name, 
			p.stock as current_stock,
			p.supplier_name as supplier_name,
			p.conversion as conversion,
			p.unit as unit,
			p.unit_big as unit_big,
			p.shelf_life_days as shelf_life_days,
			p.expiry_date as expiry_date,
			COALESCE(CAST(SUM(ti.qty) AS double precision) / 7.0, 0.0) as avg_sales_per_day,
			CASE 
				WHEN COALESCE(SUM(ti.qty), 0) > 0 THEN CAST(p.stock AS double precision) / (CAST(SUM(ti.qty) AS double precision) / 7.0) 
				ELSE 999.0 
			END as days_remaining
		FROM products p
		LEFT JOIN transaction_items ti ON p.id = ti.product_id
		LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.created_at >= ?
		WHERE p.is_active = true
		GROUP BY p.id, p.name, p.stock, p.supplier_name, p.conversion, p.unit, p.unit_big, p.shelf_life_days, p.expiry_date
		ORDER BY days_remaining ASC
	`

	if err := database.DB.Raw(query, sevenDaysAgo).Scan(&rawSuggestions).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menghitung data restock", err.Error())
		return
	}

	var suggestions []models.RestockSuggestion

	for _, raw := range rawSuggestions {
		// Pilar 1: Dead Stock filtering (hanya rekomendasikan jika laju penjualan > 0)
		if !(raw.DaysRemaining <= 3.0 || (raw.CurrentStock <= 5 && raw.AvgSalesPerDay > 0)) {
			continue
		}

		// Fallback shelf life jika tidak diisi/nol
		shelfLife := raw.ShelfLifeDays
		if shelfLife <= 0 {
			shelfLife = 30 // default 30 hari
		}

		// Pilar 3: Risk tier classification & target coverage
		var riskTier string
		var targetCoverage int
		if shelfLife <= 14 {
			riskTier = "high"
			targetCoverage = 3 // 3 hari stok untuk barang berisiko tinggi
		} else if shelfLife <= 90 {
			riskTier = "medium"
			targetCoverage = 7 // 7 hari stok untuk barang berisiko sedang
		} else {
			riskTier = "low"
			targetCoverage = 14 // 14 hari stok untuk barang berisiko rendah
		}

		// Hitung data proyeksi kebutuhan harian & mingguan
		dailyDemand := raw.AvgSalesPerDay
		weeklyDemand := raw.AvgSalesPerDay * 7.0

		// Pilar 2: Hitung Saran Restok (Recommend Qty)
		recPcs := int(math.Ceil((raw.AvgSalesPerDay * float64(targetCoverage)) - float64(raw.CurrentStock)))
		if recPcs < 0 {
			recPcs = 0
		}

		// Hitung Batas Maksimum Aman (Ceiling Qty)
		maxPcs := int(math.Ceil((raw.AvgSalesPerDay * float64(shelfLife)) - float64(raw.CurrentStock)))
		if maxPcs < 0 {
			maxPcs = 0
		}

		// Konversi ke Satuan Grosir
		recBig := 0
		maxBig := 0
		if raw.Conversion > 0 {
			recBig = int(math.Ceil(float64(recPcs) / float64(raw.Conversion)))
			maxBig = int(math.Ceil(float64(maxPcs) / float64(raw.Conversion)))
		}

		suggestions = append(suggestions, models.RestockSuggestion{
			ProductID:         raw.ProductID,
			ProductName:       raw.ProductName,
			CurrentStock:      raw.CurrentStock,
			AvgSalesPerDay:    raw.AvgSalesPerDay,
			DaysRemaining:     raw.DaysRemaining,
			SupplierName:      raw.SupplierName,
			Conversion:        raw.Conversion,
			Unit:              raw.Unit,
			UnitBig:           raw.UnitBig,
			ShelfLifeDays:     raw.ShelfLifeDays,
			ExpiryDate:        raw.ExpiryDate,
			DailyDemand:       dailyDemand,
			WeeklyDemand:      weeklyDemand,
			RecommendQty:      recPcs,
			RecommendBigQty:   recBig,
			MaxSafeQty:        maxPcs,
			MaxSafeBigQty:     maxBig,
			RiskTier:          riskTier,
		})
	}

	utils.OK(c, "Data restock berhasil dihitung", suggestions)
}

// ImportProductsCSV godoc
// @Summary      Import products via CSV
// @Description  Bulk import products into the database using a CSV file.
// @Tags         Products
// @Accept       multipart/form-data
// @Produce      json
// @Param        file  formData  file  true  "CSV file to upload"
// @Security     BearerAuth
// @Success      200   {object}  map[string]interface{} "Successfully imported products"
// @Failure      400   {object}  map[string]interface{} "Invalid file format or validation error"
// @Failure      500   {object}  map[string]interface{} "Database error"
// @Router       /api/v1/products/import [post]
func ImportProductsCSV(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Gorontalo upload gagal", "error": err.Error()})
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(header.Filename), ".csv") {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format file salah", "error": "File harus berupa ekstensi .csv"})
		return
	}

	csvReader := csv.NewReader(file)
	isHeader := true
	var productsToUpsert []models.Product
	lineCount := 0

	for {
		lineCount++
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": fmt.Sprintf("Gagal membaca baris ke-%d", lineCount), "error": err.Error()})
			return
		}

		if isHeader {
			isHeader = false
			continue
		}

		if len(record) != 10 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false, 
				"message": fmt.Sprintf("Format kolom tidak sesuai pada baris %d", lineCount), 
				"error":   fmt.Sprintf("Terdeteksi %d kolom. Pastikan CSV memiliki tepat 10 kolom sesuai template", len(record)),
			})
			return
		}

		name := strings.TrimSpace(record[0])
		barcode := strings.TrimSpace(record[1])
		bestPrice, _ := strconv.Atoi(record[2])
		price, _ := strconv.Atoi(record[3])
		priceBig, _ := strconv.Atoi(record[4])
		stock, _ := strconv.ParseFloat(record[5], 64)
		unit := strings.TrimSpace(record[6])
		unitBig := strings.TrimSpace(record[7])
		conversion, _ := strconv.Atoi(record[8])
		supplierName := strings.TrimSpace(record[9])

		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": fmt.Sprintf("Validasi gagal di baris %d", lineCount), "error": "Nama produk tidak boleh kosong"})
			return
		}
		if price <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": fmt.Sprintf("Validasi gagal pada produk '%s'", name), "error": "Harga jual retail (price) harus lebih besar dari 0"})
			return
		}
		if conversion <= 0 {
			conversion = 1 
		}

		productsToUpsert = append(productsToUpsert, models.Product{
			Name:         name,
			Barcode:      barcode,
			BestPrice:    bestPrice,
			Price:        price,
			PriceBig:     priceBig,
			Stock:        stock,
			Unit:         unit,
			UnitBig:      unitBig,
			Conversion:   conversion,
			SupplierName: supplierName,
			IsActive:     true,
		})
	}

	if len(productsToUpsert) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Tidak ada data produk yang valid untuk diimpor"})
		return
	}

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		return tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "barcode"}},
			DoUpdates: clause.AssignmentColumns([]string{"name", "best_price", "price", "price_big", "supplier_name"}),
		}).Create(&productsToUpsert).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan data ke database", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Berhasil memproses massal %d produk ke sistem GoPOS", len(productsToUpsert)),
		"data": gin.H{
			"processed_count": len(productsToUpsert),
		},
	})
}

type BatchProductItem struct {
	Name         string  `json:"name"`
	Barcode      string  `json:"barcode"`
	Price        int     `json:"price"`
	PriceMember  int     `json:"price_member"`
	BestPrice    int     `json:"best_price"`
	Unit         string  `json:"unit"`
	MinStock     int     `json:"min_stock"`
	Stock        float64 `json:"stock"`
	UnitBig      string  `json:"unit_big"`
	Conversion   int     `json:"conversion"`
	PriceBig     int     `json:"price_big"`
	SupplierName string  `json:"supplier_name"`
	Action       string  `json:"action"` // "create", "update", or "skip"
}

type BatchImportPayload struct {
	Products []BatchProductItem `json:"products"`
}

type BatchItemResult struct {
	Index   int    `json:"index"`
	Status  string `json:"status"` // "success", "updated", "skipped", "failed"
	Name    string `json:"name"`
	Barcode string `json:"barcode"`
	Error   string `json:"error,omitempty"`
}

// BatchImportProducts godoc
// @Summary      Batch import products in chunks
// @Description  Bulk process products JSON array chunk with item-by-item action (create/update/skip), validation, and status details
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        payload  body  BatchImportPayload  true  "Chunk of product items"
// @Security     BearerAuth
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Router       /api/v1/products/batch-import [post]
func BatchImportProducts(c *gin.Context) {
	var payload BatchImportPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format JSON batch tidak valid", "error": err.Error()})
		return
	}

	if len(payload.Products) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Array produk tidak boleh kosong"})
		return
	}

	results := make([]BatchItemResult, 0, len(payload.Products))
	successCount := 0
	updatedCount := 0
	skippedCount := 0
	failedCount := 0

	dateStr := time.Now().Format("20060102")

	for i, item := range payload.Products {
		action := strings.ToLower(strings.TrimSpace(item.Action))
		if action == "" {
			action = "create"
		}

		name := strings.TrimSpace(item.Name)
		barcode := strings.TrimSpace(item.Barcode)

		if action == "skip" {
			skippedCount++
			results = append(results, BatchItemResult{
				Index:   i,
				Status:  "skipped",
				Name:    name,
				Barcode: barcode,
			})
			continue
		}

		// Server-side validation
		if name == "" {
			failedCount++
			results = append(results, BatchItemResult{
				Index:   i,
				Status:  "failed",
				Name:    name,
				Barcode: barcode,
				Error:   "Nama barang wajib diisi",
			})
			continue
		}

		if item.Price <= 0 {
			failedCount++
			results = append(results, BatchItemResult{
				Index:   i,
				Status:  "failed",
				Name:    name,
				Barcode: barcode,
				Error:   "Harga jual eceran (price) harus lebih besar dari 0",
			})
			continue
		}

		// Defaults
		minStock := item.MinStock
		if minStock <= 0 {
			minStock = 5
		}

		unit := strings.TrimSpace(item.Unit)
		if unit == "" {
			unit = "Pcs"
		}

		if barcode == "" {
			barcode = fmt.Sprintf("PRD-%s-%03d", dateStr, i+1)
		}

		unitBig := strings.TrimSpace(item.UnitBig)
		conversion := item.Conversion
		priceBig := item.PriceBig
		if unitBig != "" && (conversion <= 0 || priceBig <= 0) {
			// Incomplete wholesale info -> ignore wholesale fields
			unitBig = ""
			conversion = 1
			priceBig = 0
		}
		if conversion <= 0 {
			conversion = 1
		}

		if action == "update" {
			var existing models.Product
			err := database.DB.Where("barcode = ? AND is_active = ?", barcode, true).First(&existing).Error
			if err == nil {
				existing.Name = name
				existing.Price = item.Price
				existing.PriceMember = item.PriceMember
				existing.BestPrice = item.BestPrice
				existing.Unit = unit
				existing.MinStock = minStock
				existing.Stock = item.Stock
				existing.UnitBig = unitBig
				existing.Conversion = conversion
				existing.PriceBig = priceBig
				if item.SupplierName != "" {
					existing.SupplierName = strings.TrimSpace(item.SupplierName)
				}
				if saveErr := database.DB.Save(&existing).Error; saveErr != nil {
					failedCount++
					results = append(results, BatchItemResult{
						Index:   i,
						Status:  "failed",
						Name:    name,
						Barcode: barcode,
						Error:   saveErr.Error(),
					})
				} else {
					updatedCount++
					results = append(results, BatchItemResult{
						Index:   i,
						Status:  "updated",
						Name:    name,
						Barcode: barcode,
					})
				}
				continue
			}
			// If product to update was not found, fall through to create it as new product
		}

		// Action: "create"
		product := models.Product{
			Name:         name,
			Barcode:      barcode,
			Price:        item.Price,
			PriceMember:  item.PriceMember,
			BestPrice:    item.BestPrice,
			Unit:         unit,
			MinStock:     minStock,
			Stock:        item.Stock,
			UnitBig:      unitBig,
			Conversion:   conversion,
			PriceBig:     priceBig,
			SupplierName: strings.TrimSpace(item.SupplierName),
			IsActive:     true,
		}

		err := database.DB.Create(&product).Error
		if err != nil {
			failedCount++
			results = append(results, BatchItemResult{
				Index:   i,
				Status:  "failed",
				Name:    name,
				Barcode: barcode,
				Error:   err.Error(),
			})
		} else {
			successCount++
			results = append(results, BatchItemResult{
				Index:   i,
				Status:  "success",
				Name:    name,
				Barcode: barcode,
			})
		}
	}

	utils.OK(c, fmt.Sprintf("Batch selesai diproses: %d dibuat, %d diperbarui, %d dilewati, %d gagal", successCount, updatedCount, skippedCount, failedCount), gin.H{
		"processed":     len(payload.Products),
		"success_count": successCount,
		"updated_count": updatedCount,
		"skipped_count": skippedCount,
		"failed_count":  failedCount,
		"details":       results,
	})
}

// GetProductBarcodes godoc
// @Summary      Get existing product barcodes list
// @Description  Retrieve array of all active product barcodes for fast duplicate checking in frontend
// @Tags         Products
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /api/v1/products/barcodes [get]
func GetProductBarcodes(c *gin.Context) {
	var barcodes []string
	if err := database.DB.Model(&models.Product{}).
		Where("is_active = ? AND barcode IS NOT NULL AND barcode != ''", true).
		Pluck("barcode", &barcodes).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil daftar barcode", err.Error())
		return
	}
	utils.OK(c, "Daftar barcode berhasil diambil", barcodes)
}

