package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

	if err := database.DB.Delete(&member).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menghapus member", err.Error())
		return
	}

	utils.OK(c, "Member berhasil dihapus dari database", nil)
}
