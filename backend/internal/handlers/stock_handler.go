package handlers

import (
	"net/http"
	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func CreateStockAdjustment(c *gin.Context) {
	userID, ok := utils.GetUserID(c)
	if !ok {
		utils.Fail(c, http.StatusUnauthorized, "User tidak terautentikasi", "unauthorized")
		return
	}

	var input models.StockAdjustmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	tx := database.DB.Begin()

	var product models.Product
	if err := tx.First(&product, input.ProductID).Error; err != nil {
		tx.Rollback()
		utils.Fail(c, http.StatusNotFound, "Produk tidak ditemukan", err.Error())
		return
	}

	newStock := product.Stock
	switch input.Type {
	case "in":
		newStock += input.Qty
	case "out", "correction":
		if input.Type == "out" || (input.Type == "correction" && input.Qty > 0) {
			if product.Stock < input.Qty {
				tx.Rollback()
				utils.Fail(c, http.StatusBadRequest, "Stok tidak mencukupi untuk dikurangi", "insufficient stock")
				return
			}
			newStock -= input.Qty
		}
	}
	product.Stock = newStock
	if err := tx.Save(&product).Error; err != nil {
		tx.Rollback()
		utils.Fail(c, http.StatusInternalServerError, "Gagal memperbarui stok produk", err.Error())
		return
	}

	adjustment := models.StockAdjustment{
		ProductID:  input.ProductID,
		UserID:     userID,
		Type:       input.Type,
		Qty:        input.Qty,
		StockAfter: newStock, 
		Reason:     input.Reason,
	}

	if err := tx.Create(&adjustment).Error; err != nil {
		tx.Rollback()
		utils.Fail(c, http.StatusInternalServerError, "Gagal mencatat riwayat adjustment", err.Error())
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Stok berhasil disesuaikan secara manual",
		"data":    adjustment,
	})
}