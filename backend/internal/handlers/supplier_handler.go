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

// GetSuppliers godoc
// @Summary      Get list of suppliers & distributors
// @Description  Retrieve all active suppliers with preloaded sales contacts and search filter
// @Tags         Suppliers
// @Produce      json
// @Param        search query string false "Search by supplier name or sales name"
// @Success      200 {object} map[string]interface{}
// @Router       /api/v1/suppliers [get]
func GetSuppliers(c *gin.Context) {
	searchQuery := c.Query("search")

	var suppliers []models.Supplier
	query := database.DB.Where("is_active = ?", true).
		Preload("SalesContacts", "is_active = ?", true).
		Order("name asc")

	if searchQuery != "" {
		s := "%" + strings.TrimSpace(searchQuery) + "%"
		query = query.Where(
			"name LIKE ? OR id IN (SELECT supplier_id FROM supplier_sales WHERE (sales_name LIKE ? OR phone_number LIKE ?) AND is_active = true)",
			s, s, s,
		)
	}

	if err := query.Find(&suppliers).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil data distributor", err.Error())
		return
	}

	utils.OK(c, "Daftar distributor berhasil diambil", suppliers)
}

// CreateSupplier godoc
// @Summary      Create new supplier and sales contacts
// @Tags         Suppliers
// @Accept       json
// @Produce      json
// @Param        payload body models.CreateSupplierInput true "Supplier input data"
// @Success      201 {object} map[string]interface{}
// @Router       /api/v1/suppliers [post]
func CreateSupplier(c *gin.Context) {
	userID, ok := utils.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Sesi tidak valid"})
		return
	}

	var input models.CreateSupplierInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data input tidak valid", err.Error())
		return
	}

	supplier := models.Supplier{
		Name:     strings.TrimSpace(input.Name),
		Address:  strings.TrimSpace(input.Address),
		Notes:    strings.TrimSpace(input.Notes),
		IsActive: true,
	}

	for _, sc := range input.SalesContacts {
		if strings.TrimSpace(sc.SalesName) != "" {
			visitType := sc.VisitType
			if visitType == "" {
				visitType = models.VisitBoth
			}
			supplier.SalesContacts = append(supplier.SalesContacts, models.SupplierSales{
				SalesName:   strings.TrimSpace(sc.SalesName),
				Category:    strings.TrimSpace(sc.Category),
				PhoneNumber: strings.TrimSpace(sc.PhoneNumber),
				VisitDay:    strings.TrimSpace(sc.VisitDay),
				VisitType:   visitType,
				Notes:       strings.TrimSpace(sc.Notes),
				IsActive:    true,
			})
		}
	}

	if err := database.DB.Create(&supplier).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menambahkan distributor baru", err.Error())
		return
	}

	_ = utils.RecordActivity(nil, userID, "CREATE_SUPPLIER", "suppliers", supplier.ID, "",
		fmt.Sprintf("Distributor: %s, Sales: %d kontak", supplier.Name, len(supplier.SalesContacts)), c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Distributor baru berhasil ditambahkan",
		"data":    supplier,
	})
}

// EditSupplier godoc
// @Summary      Edit existing supplier and sales contacts
// @Tags         Suppliers
// @Accept       json
// @Produce      json
// @Param        id path int true "Supplier ID"
// @Param        payload body models.CreateSupplierInput true "Supplier input data"
// @Success      200 {object} map[string]interface{}
// @Router       /api/v1/suppliers/{id} [put]
func EditSupplier(c *gin.Context) {
	id := c.Param("id")
	userID, ok := utils.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Sesi tidak valid"})
		return
	}

	var input models.CreateSupplierInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data input tidak valid", err.Error())
		return
	}

	var supplier models.Supplier
	if err := database.DB.Preload("SalesContacts").First(&supplier, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Distributor tidak ditemukan", err.Error())
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		supplier.Name = strings.TrimSpace(input.Name)
		supplier.Address = strings.TrimSpace(input.Address)
		supplier.Notes = strings.TrimSpace(input.Notes)

		if err := tx.Save(&supplier).Error; err != nil {
			return err
		}

		// Soft delete sales contacts not in input list
		inputSalesIDs := make([]uint, 0)
		for _, sc := range input.SalesContacts {
			if sc.ID > 0 {
				inputSalesIDs = append(inputSalesIDs, sc.ID)
			}
		}

		if len(inputSalesIDs) > 0 {
			if err := tx.Model(&models.SupplierSales{}).
				Where("supplier_id = ? AND id NOT IN ?", supplier.ID, inputSalesIDs).
				Update("is_active", false).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Model(&models.SupplierSales{}).
				Where("supplier_id = ?", supplier.ID).
				Update("is_active", false).Error; err != nil {
				return err
			}
		}

		// Insert or update input sales contacts
		for _, sc := range input.SalesContacts {
			if strings.TrimSpace(sc.SalesName) == "" {
				continue
			}
			visitType := sc.VisitType
			if visitType == "" {
				visitType = models.VisitBoth
			}

			if sc.ID > 0 {
				// Update existing sales contact
				if err := tx.Model(&models.SupplierSales{}).Where("id = ? AND supplier_id = ?", sc.ID, supplier.ID).
					Updates(map[string]interface{}{
						"sales_name":   strings.TrimSpace(sc.SalesName),
						"category":     strings.TrimSpace(sc.Category),
						"phone_number": strings.TrimSpace(sc.PhoneNumber),
						"visit_day":    strings.TrimSpace(sc.VisitDay),
						"visit_type":   visitType,
						"notes":        strings.TrimSpace(sc.Notes),
						"is_active":    true,
					}).Error; err != nil {
					return err
				}
			} else {
				// Create new sales contact
				newSales := models.SupplierSales{
					SupplierID:  supplier.ID,
					SalesName:   strings.TrimSpace(sc.SalesName),
					Category:    strings.TrimSpace(sc.Category),
					PhoneNumber: strings.TrimSpace(sc.PhoneNumber),
					VisitDay:    strings.TrimSpace(sc.VisitDay),
					VisitType:   visitType,
					Notes:       strings.TrimSpace(sc.Notes),
					IsActive:    true,
				}
				if err := tx.Create(&newSales).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})

	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal memperbarui data distributor", err.Error())
		return
	}

	_ = utils.RecordActivity(nil, userID, "EDIT_SUPPLIER", "suppliers", supplier.ID, "",
		fmt.Sprintf("Distributor: %s diperbarui", supplier.Name), c.ClientIP())

	// Fetch updated supplier with sales contacts
	var updatedSupplier models.Supplier
	database.DB.Preload("SalesContacts", "is_active = ?", true).First(&updatedSupplier, supplier.ID)

	utils.OK(c, "Data distributor berhasil diperbarui", updatedSupplier)
}

// DeleteSupplier godoc
// @Summary      Soft delete supplier
// @Tags         Suppliers
// @Produce      json
// @Param        id path int true "Supplier ID"
// @Success      200 {object} map[string]interface{}
// @Router       /api/v1/suppliers/{id} [delete]
func DeleteSupplier(c *gin.Context) {
	id := c.Param("id")
	userID, ok := utils.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Sesi tidak valid"})
		return
	}

	var supplier models.Supplier
	if err := database.DB.First(&supplier, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Distributor tidak ditemukan", err.Error())
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&supplier).Update("is_active", false).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.SupplierSales{}).Where("supplier_id = ?", supplier.ID).Update("is_active", false).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menghapus distributor", err.Error())
		return
	}

	_ = utils.RecordActivity(nil, userID, "DELETE_SUPPLIER", "suppliers", supplier.ID, "IsActive: true", "IsActive: false", c.ClientIP())

	utils.OK(c, "Distributor berhasil dinonaktifkan", nil)
}

// GetTodaySchedule godoc
// @Summary      Get sales visit schedule for today or specific day
// @Tags         Suppliers
// @Produce      json
// @Param        day query string false "Visit day (e.g. Monday)"
// @Success      200 {object} map[string]interface{}
// @Router       /api/v1/suppliers/schedule [get]
func GetTodaySchedule(c *gin.Context) {
	day := c.Query("day")
	if day == "" {
		day = time.Now().Weekday().String() // Default e.g. "Monday", "Tuesday"
	}

	var salesList []models.SupplierSales
	if err := database.DB.Where("visit_day = ? AND is_active = ?", day, true).Find(&salesList).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil jadwal kunjungan", err.Error())
		return
	}

	// Fetch supplier names
	supplierIDs := make([]uint, 0)
	for _, s := range salesList {
		supplierIDs = append(supplierIDs, s.SupplierID)
	}

	supplierMap := make(map[uint]models.Supplier)
	if len(supplierIDs) > 0 {
		var suppliers []models.Supplier
		database.DB.Where("id IN ? AND is_active = ?", supplierIDs, true).Find(&suppliers)
		for _, sup := range suppliers {
			supplierMap[sup.ID] = sup
		}
	}

	type ScheduleItem struct {
		models.SupplierSales
		SupplierName    string `json:"supplier_name"`
		SupplierAddress string `json:"supplier_address"`
	}

	takingOrderList := make([]ScheduleItem, 0)
	billingList := make([]ScheduleItem, 0)

	for _, s := range salesList {
		sup, ok := supplierMap[s.SupplierID]
		if !ok {
			continue
		}

		item := ScheduleItem{
			SupplierSales:   s,
			SupplierName:    sup.Name,
			SupplierAddress: sup.Address,
		}

		if s.VisitType == models.VisitTakingOrder || s.VisitType == models.VisitBoth {
			takingOrderList = append(takingOrderList, item)
		}
		if s.VisitType == models.VisitBilling || s.VisitType == models.VisitBoth {
			billingList = append(billingList, item)
		}
	}

	utils.OK(c, fmt.Sprintf("Jadwal Kunjungan Sales Hari %s", day), gin.H{
		"day":          day,
		"taking_order": takingOrderList,
		"billing":      billingList,
		"total_sales":  len(salesList),
	})
}
