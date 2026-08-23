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

// Helper to generate unique Member Code
func generateMemberCode() string {
	dateStr := time.Now().Format("20060102")
	uniqueID := strings.ToUpper(uuid.New().String()[:8])
	return fmt.Sprintf("MBR-%s-%s", dateStr, uniqueID)
}

// GetMembers godoc
// @Summary      Get all members
// @Description  Retrieve a list of all registered member accounts. Accessible to cashiers and admins.
// @Tags         Members
// @Produce      json
// @Success      200      {object}  map[string]interface{} "Members list retrieved successfully"
// @Router       /api/v1/members [get]
func GetMembers(c *gin.Context) {
	var members []models.Member
	if err := database.DB.Order("name asc").Find(&members).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal memuat data member", err.Error())
		return
	}
	utils.OK(c, "Daftar member berhasil diambil", members)
}

// CreateMember godoc
// @Summary      Create a new member
// @Description  Register a new member with auto-generated member code. Accessible to cashiers and admins.
// @Tags         Members
// @Accept       json
// @Produce      json
// @Param        member   body      models.CreateMemberInput  true  "Member Creation Payload"
// @Success      201      {object}  map[string]interface{} "Member successfully created"
// @Router       /api/v1/members [post]
func CreateMember(c *gin.Context) {
	var input models.CreateMemberInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	member := models.Member{
		MemberCode: generateMemberCode(),
		Name:       input.Name,
		Phone:      input.Phone,
		IsActive:   true,
		CreatedAt:  time.Now(),
	}

	if err := database.DB.Create(&member).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal membuat member baru", err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Member baru berhasil didaftarkan",
		"data":    member,
	})
}

// EditMember godoc
// @Summary      Edit member details
// @Description  Modify the name and phone number of a registered member by ID. Accessible to cashiers and admins.
// @Tags         Members
// @Accept       json
// @Produce      json
// @Param        id       path      int                       true  "Member Database ID"
// @Param        member   body      models.CreateMemberInput  true  "Member Edit Payload"
// @Success      200      {object}  map[string]interface{} "Member successfully updated"
// @Router       /api/v1/members/{id} [put]
func EditMember(c *gin.Context) {
	id := c.Param("id")
	var input models.CreateMemberInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data tidak valid", err.Error())
		return
	}

	var member models.Member
	if err := database.DB.First(&member, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Member tidak ditemukan", err.Error())
		return
	}

	member.Name = input.Name
	member.Phone = input.Phone

	if err := database.DB.Save(&member).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengupdate data member", err.Error())
		return
	}

	utils.OK(c, "Data member berhasil diperbarui", member)
}

// DeleteMember godoc
// @Summary      Delete a member
// @Description  Permanently delete a registered member account from database by ID. Accessible to cashiers and admins.
// @Tags         Members
// @Param        id   path      int  true  "Member Database ID"
// @Success      200  {object}  map[string]interface{} "Member successfully deleted"
// @Router       /api/v1/members/{id} [delete]
func DeleteMember(c *gin.Context) {
	id := c.Param("id")

	var member models.Member
	if err := database.DB.First(&member, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "Member tidak ditemukan", err.Error())
		return
	}

	if member.TotalDebt > 0 {
		utils.Fail(c, http.StatusBadRequest, "Member tidak dapat dihapus", fmt.Sprintf("Member '%s' masih memiliki sisa utang kasbon aktif (Rp %d). Utang wajib dilunasi terlebih dahulu.", member.Name, member.TotalDebt))
		return
	}

	if err := database.DB.Delete(&member).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menghapus member", err.Error())
		return
	}

	utils.OK(c, "Member berhasil dihapus dari database", nil)
}

// ExportMembersCSV godoc
// @Summary      Export members list to CSV format
// @Tags         Members
// @Produce      text/csv
// @Router       /api/v1/members/export [get]
func ExportMembersCSV(c *gin.Context) {
	var members []models.Member
	if err := database.DB.Order("name asc").Find(&members).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengambil data member untuk ekspor", err.Error())
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=members_export.csv")

	var sb strings.Builder
	sb.WriteString("ID,Kode Member,Nama Lengkap,No HP,Total Utang,Status,Tanggal Daftar\n")

	for _, m := range members {
		statusStr := "Aktif"
		if !m.IsActive {
			statusStr = "Nonaktif"
		}
		sb.WriteString(fmt.Sprintf("%d,\"%s\",\"%s\",\"%s\",%d,\"%s\",\"%s\"\n",
			m.ID,
			strings.ReplaceAll(m.MemberCode, "\"", "\"\""),
			strings.ReplaceAll(m.Name, "\"", "\"\""),
			strings.ReplaceAll(m.Phone, "\"", "\"\""),
			m.TotalDebt,
			statusStr,
			m.CreatedAt.Format("2006-01-02 15:04:05"),
		))
	}

	c.String(http.StatusOK, sb.String())
}

type ImportMemberItem struct {
	Name  string `json:"name" binding:"required"`
	Phone string `json:"phone"`
}

type ImportMembersPayload struct {
	Members []ImportMemberItem `json:"members" binding:"required,min=1"`
}

// ImportMembersCSV godoc
// @Summary      Bulk import members from CSV payload
// @Tags         Members
// @Accept       json
// @Produce      json
// @Router       /api/v1/members/import [post]
func ImportMembersCSV(c *gin.Context) {
	var payload ImportMembersPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Data import tidak valid", err.Error())
		return
	}

	importedCount := 0
	skippedCount := 0

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		for _, item := range payload.Members {
			name := strings.TrimSpace(item.Name)
			if name == "" {
				skippedCount++
				continue
			}

			phone := strings.TrimSpace(item.Phone)

			member := models.Member{
				MemberCode: generateMemberCode(),
				Name:       name,
				Phone:      phone,
				TotalDebt:  0,
				IsActive:   true,
				CreatedAt:  time.Now(),
			}

			if err := tx.Create(&member).Error; err != nil {
				skippedCount++
				continue
			}

			importedCount++
		}
		return nil
	})

	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal memproses import data member", err.Error())
		return
	}

	utils.OK(c, fmt.Sprintf("Berhasil mengimpor %d member (%d dilewati)", importedCount, skippedCount), gin.H{
		"imported_count": importedCount,
		"skipped_count":  skippedCount,
	})
}
