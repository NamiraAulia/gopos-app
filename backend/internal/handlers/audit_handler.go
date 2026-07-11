package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"
)

// GetAuditLogs godoc
// @Summary      Get system audit logs
// @Description  Retrieve system activity logs with pagination. Restricted to admin access only.
// @Tags         Admin
// @Produce      json
// @Param        page   query     int  false  "Page number"
// @Param        limit  query     int  false  "Items per page"
// @Success      200    {object}  map[string]interface{} "Audit logs successfully retrieved"
// @Router       /api/v1/admin/audit-logs [get]
func GetAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "15"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 15
	}

	offset := (page - 1) * limit

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := database.DB.Model(&models.ActivityLog{})

	if startDate != "" {
		query = query.Where("created_at >= ?", startDate+" 00:00:00")
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate+" 23:59:59")
	}

	var total int64
	query.Count(&total)

	var logs []models.ActivityLog
	err := query.Preload("User").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&logs).
		Error

	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil log aktivitas", err.Error())
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Daftar log aktivitas berhasil diambil",
		"data":    logs,
		"meta": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}
