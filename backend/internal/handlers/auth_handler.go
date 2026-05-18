package handlers

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"
)

func Login(c *gin.Context) {
	var input models.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Input tidak valid", err.Error())
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		utils.Fail(c, http.StatusUnauthorized, "Email atau password salah", "invalid credentials")
		return
	}

	if !user.IsActive {
		utils.Fail(c, http.StatusUnauthorized, "Akun ini telah dinonaktifkan", "account inactive")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		utils.Fail(c, http.StatusUnauthorized, "Email atau password salah", "invalid credentials")
		return
	}

	jwtKey := []byte(os.Getenv("JWT_SECRET"))
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"email":    user.Email,
		"role":     user.Role,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Gagal generate token", err.Error())
		return
	}

	utils.OK(c, "Login berhasil!", gin.H{
		"token": tokenString,
		"user":  user,
	})
}
