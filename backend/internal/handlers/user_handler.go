package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"
)

// CreateUser godoc
// @Summary      Create a new user account
// @Description  Register a new cashier (kasir) or administrator account. Restricted to admin access only.
// @Tags         Users Management
// @Accept       json
// @Produce      json
// @Param        user  body      models.CreateUserInput  true  "User Creation Payload Data"
// @Success      200   {object}  map[string]interface{}  "User successfully created"
// @Failure      400   {object}  map[string]interface{}  "Invalid input request format or invalid role assignment"
// @Failure      409   {object}  map[string]interface{}  "Email address is already registered"
// @Failure      500   {object}  map[string]interface{}  "Internal server error during password encryption"
// @Security     BearerAuth
// @Router       /api/v1/users [post]
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

// GetUsers godoc
// @Summary      Retrieve all users
// @Description  Get a full list of registered accounts ordered by their unique database ID. Restricted to admin access only.
// @Tags         Users Management
// @Produce      json
// @Success      200   {object}  map[string]interface{}  "Successfully fetched all system users"
// @Router       /api/v1/users [get]
func GetUsers(c *gin.Context) {
	var users []models.User
	database.DB.Order("id asc").Find(&users)
	utils.OK(c, "List semua user", users)
}

// DeactivateUser godoc
// @Summary      Deactivate a user account (Soft Disable)
// @Description  Set user active status flag to false to temporarily revoke platform access. Self-deactivation is prohibited. Restricted to admin access only.
// @Tags         Users Management
// @Produce      json
// @Param        id    path      int                     true  "Target Numeric User Database ID"
// @Success      200   {object}  map[string]interface{}  "User profile successfully disabled"
// @Failure      400   {object}  map[string]interface{}  "Action rejected because an administrator cannot suspend their own session account"
// @Failure      404   {object}  map[string]interface{}  "No user entry found matching the given target ID"
// @Failure      500   {object}  map[string]interface{}  "Database connection error modifying data"
// @Router       /api/v1/users/{id}/deactivate [put]
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

// ActivateUser godoc
// @Summary      Re-activate a suspended user account
// @Description  Restore account system operations by resetting the active status flag back to true. Restricted to admin access only.
// @Tags         Users Management
// @Produce      json
// @Param        id    path      int                     true  "Target Numeric User Database ID"
// @Success      200   {object}  map[string]interface{}  "User profile successfully re-activated"
// @Failure      404   {object}  map[string]interface{}  "No user entry found matching the given target ID"
// @Failure      500   {object}  map[string]interface{}  "Database connection error updating row state"
// @Router       /api/v1/users/{id}/activate [put]
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

func ResetPassword(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Password baru tidak valid (minimal 6 karakter)", err.Error())
		return
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "User tidak ditemukan", err.Error())
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal hash password", err.Error())
		return
	}

	if err := database.DB.Model(&user).Update("password", string(hashed)).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal update password", err.Error())
		return
	}

	utils.OK(c, "Password berhasil direset", nil)
}

func ChangeOwnPassword(c *gin.Context) {
	var input struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	rawUserID, _ := c.Get("user_id")
	userID := uint(rawUserID.(float64))

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		utils.Fail(c, http.StatusNotFound, "User tidak ditemukan", err.Error())
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.OldPassword)); err != nil {
		utils.Fail(c, http.StatusUnauthorized, "Password lama tidak cocok", "wrong password")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal hash password", err.Error())
		return
	}

	if err := database.DB.Model(&user).Update("password", string(hashed)).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal update password", err.Error())
		return
	}

	utils.OK(c, "Password berhasil diubah", nil)
}