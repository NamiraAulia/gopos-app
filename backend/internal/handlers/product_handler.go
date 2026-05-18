package handlers

import (
	"net/http"
	"time"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

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

func AddProducts(c *gin.Context) {
	var product models.Product

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format data tidak valid", "error": err.Error()})
		return
	}

	if product.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Nama produk wajib diisi"})
		return
	}
	if product.Price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Harga produk harus lebih dari 0"})
		return
	}

	if errDB := database.DB.Create(&product).Error; errDB != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan produk ke database", "error": errDB.Error()})
		return
	}

	response := utils.Success("Produk berhasil ditambahkan", product)
	c.JSON(http.StatusCreated, response)
}

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
	product.Price = input.Price
	product.Stock = input.Stock
	product.Barcode = input.Barcode

	if err := database.DB.Save(&product).Error; err != nil {
		response := utils.Error("Gagal mengupdate barang di database", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	response := utils.Success("Barang berhasil diupdate!", product)
	c.JSON(http.StatusOK, response)
}

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
