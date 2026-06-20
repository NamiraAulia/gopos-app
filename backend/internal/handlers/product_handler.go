package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type AddProductPayload struct {
	Name           string `json:"name" binding:"required"`
	Barcode        string `json:"barcode"`
	BestPrice      int    `json:"best_price" binding:"required"`
	Price          int    `json:"price" binding:"required"`
	PriceBig       int    `json:"price_big"`
	Stock          int    `json:"stock"`
	Unit           string `json:"unit" binding:"required"`
	UnitBig        string `json:"unit_big"`
	Conversion     int    `json:"conversion"`
	UnitChoice     string `json:"unit_choice"`
	SupplierName   string `json:"supplier_name"`
	DiscountAmount int    `json:"discount_amount"`
	IsPromo        bool   `json:"is_promo"`
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
		finalStock = input.Stock * input.Conversion
	}

	product := models.Product{
		Name:         input.Name,
		Barcode:      input.Barcode,
		BestPrice:    input.BestPrice,
		Price:        input.Price,
		PriceBig:     input.PriceBig,
		Stock:        finalStock,
		Unit:         input.Unit,
		UnitBig:      input.UnitBig,
		Conversion:   input.Conversion,
		SupplierName: input.SupplierName,
		IsActive:     true,
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

	var product models.Product
	if err := database.DB.First(&product, id).Error; err != nil {
		response := utils.Error("Barang tidak ditemukan!", err.Error())
		c.JSON(http.StatusNotFound, response)
		return
	}

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

	if err := database.DB.Save(&product).Error; err != nil {
		response := utils.Error("Gagal mengupdate barang di database", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
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

	var product models.Product
	if err := database.DB.First(&product, id).Error; err != nil {
		response := utils.Error("Barang tidak ditemukan!", err.Error())
		c.JSON(http.StatusNotFound, response)
		return
	}

	database.DB.Model(&product).Update("is_active", false)

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
	var suggestions []models.RestockSuggestion

	sevenDaysAgo := time.Now().AddDate(0, 0, -7)

	query := `
		SELECT 
			p.id as product_id, 
			p.name as product_name, 
			p.stock as current_stock,
			COALESCE(SUM(ti.qty) / 7.0, 0) as avg_sales_per_day,
			CASE 
				WHEN COALESCE(SUM(ti.qty), 0) > 0 THEN p.stock / (SUM(ti.qty) / 7.0) 
				ELSE 999 
			END as days_remaining
		FROM products p
		LEFT JOIN transaction_items ti ON p.id = ti.product_id
		LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.created_at >= ?
		GROUP BY p.id, p.name, p.stock
		HAVING days_remaining <= 3 OR current_stock <= 5
		ORDER BY days_remaining ASC
	`

	if err := database.DB.Raw(query, sevenDaysAgo).Scan(&suggestions).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menghitung data restock", err.Error())
		return
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
		utils.Fail(c, http.StatusBadRequest, "Gagal memproses upload file", err.Error())
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(header.Filename), ".csv") {
		utils.Fail(c, http.StatusBadRequest, "Format file salah", "File harus berupa ekstensi .csv")
		return
	}

	csvReader := csv.NewReader(file)

	tx := database.DB.Begin()

	var successCount int
	isHeader := true

	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			tx.Rollback()
			utils.Fail(c, http.StatusBadRequest, "Gagal membaca baris data CSV", err.Error())
			return
		}

		if isHeader {
			isHeader = false
			continue
		}

		if len(record) < 10 {
			tx.Rollback()
			utils.Fail(c, http.StatusBadRequest, "Format kolom CSV tidak sesuai", "Pastikan CSV memiliki 10 kolom sesuai template")
			return
		}

		name := strings.TrimSpace(record[0])
		barcode := strings.TrimSpace(record[1])

		if name == "" {
			tx.Rollback()
			utils.Fail(c, http.StatusBadRequest, "Validasi gagal", "Ada nama produk yang kosong di dalam file")
			return
		}

		bestPrice, _ := strconv.Atoi(record[2])
		price, _ := strconv.Atoi(record[3])
		priceBig, _ := strconv.Atoi(record[4])
		stock, _ := strconv.Atoi(record[5])
		unit := strings.TrimSpace(record[6])
		unitBig := strings.TrimSpace(record[7])
		conversion, _ := strconv.Atoi(record[8])
		supplierName := strings.TrimSpace(record[9])

		if price <= 0 {
			tx.Rollback()
			utils.Fail(c, http.StatusBadRequest, "Validasi gagal", fmt.Sprintf("Harga produk '%s' harus lebih dari 0", name))
			return
		}

		if barcode != "" {
			var existingProduct models.Product
			errCheck := tx.Where("barcode = ? AND is_active = true", barcode).First(&existingProduct).Error
			if errCheck == nil {
				continue
			}
		}

		product := models.Product{
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
		}

		if err := tx.Create(&product).Error; err != nil {
			tx.Rollback()
			utils.Fail(c, http.StatusInternalServerError, "Gagal menyimpan produk dari CSV", err.Error())
			return
		}

		successCount++
	}

	tx.Commit()

	utils.OK(c, "Proses import file selesai", gin.H{
		"inserted_count": successCount,
	})
}
