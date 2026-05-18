package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"
)

// CreateUser — admin only: create a new kasir or admin account.
func CreateUser(c *gin.Context) {
	var input models.CreateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	if input.Role != "admin" && input.Role != "kasir" {
		utils.Fail(c, http.StatusBadRequest, "Role tidak valid, gunakan 'admin' atau 'kasir'", "invalid role")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal hash password", err.Error())
		return
	}

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashed),
		Role:     input.Role,
		IsActive: true,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		utils.Fail(c, http.StatusConflict, "Email sudah digunakan", err.Error())
		return
	}

	utils.OK(c, "User berhasil dibuat", user)
}

// GetUsers — admin only: list all users.
func GetUsers(c *gin.Context) {
	var users []models.User
	database.DB.Order("id asc").Find(&users)
	utils.OK(c, "List semua user", users)
}

// DeactivateUser — admin only: set is_active = false (soft disable).
func DeactivateUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "User tidak ditemukan", err.Error())
		return
	}

	// Prevent admin from deactivating themselves
	callerEmail, _ := c.Get("email")
	if user.Email == callerEmail {
		utils.Fail(c, http.StatusBadRequest, "Tidak bisa menonaktifkan akun sendiri", "self-deactivation not allowed")
		return
	}

	if err := database.DB.Model(&user).Update("is_active", false).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal menonaktifkan user", err.Error())
		return
	}

	utils.OK(c, "User berhasil dinonaktifkan", user)
}

// ActivateUser — admin only: re-enable a deactivated user.
func ActivateUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "User tidak ditemukan", err.Error())
		return
	}

	if err := database.DB.Model(&user).Update("is_active", true).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal mengaktifkan user", err.Error())
		return
	}

	utils.OK(c, "User berhasil diaktifkan", user)
}
