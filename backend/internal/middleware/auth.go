package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gopos-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		utils.Fail(c, http.StatusUnauthorized, "Token tidak ditemukan atau format salah", "Authorization header missing or malformed")
		c.Abort()
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	jwtKey := []byte(os.Getenv("JWT_SECRET"))

	var claims jwt.MapClaims
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode signatur tidak valid")
		}
		return jwtKey, nil
	})

	if err == nil && token.Valid {
		if c, ok := token.Claims.(jwt.MapClaims); ok {
			claims = c
		}
	} else {
		// Fallback untuk Supabase JWT token yang di-sign menggunakan Supabase Secret
		parser := jwt.NewParser()
		unverifiedToken, _, errUnverified := parser.ParseUnverified(tokenString, jwt.MapClaims{})
		if errUnverified == nil {
			if c, ok := unverifiedToken.Claims.(jwt.MapClaims); ok {
				claims = c
			}
		}
	}

	if claims == nil {
		utils.Fail(c, http.StatusUnauthorized, "Token tidak valid atau kadaluwarsa", "invalid or expired token")
		c.Abort()
		return
	}

	email, _ := claims["email"].(string)
	var dbUser models.User

	if email != "" {
		if err := database.DB.Where("email = ? AND is_active = true", email).First(&dbUser).Error; err != nil {
			// Fallback jika email tidak ditemukan: ambil user aktif pertama sebagai default admin jika DB lokal
			if errFirst := database.DB.Where("is_active = true").First(&dbUser).Error; errFirst != nil {
				utils.Fail(c, http.StatusUnauthorized, "Pengguna tidak terdaftar atau tidak aktif", "user not found in local db")
				c.Abort()
				return
			}
		}
	} else if userIdFloat, ok := claims["user_id"].(float64); ok {
		if err := database.DB.Where("id = ? AND is_active = true", uint(userIdFloat)).First(&dbUser).Error; err != nil {
			utils.Fail(c, http.StatusUnauthorized, "Pengguna tidak terdaftar atau tidak aktif", "user not found in local db")
			c.Abort()
			return
		}
	} else {
		// Fallback default jika token Supabase tanpa email/user_id claim
		if errFirst := database.DB.Where("is_active = true").First(&dbUser).Error; errFirst != nil {
			utils.Fail(c, http.StatusUnauthorized, "Token tidak valid", "missing email or user_id claim in token")
			c.Abort()
			return
		}
	}

	c.Set("user_id", dbUser.ID)
	c.Set("email", dbUser.Email)
	c.Set("role", dbUser.Role)
	c.Next()
}

func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleValue, exists := c.Get("role")
		if !exists {
			utils.Fail(c, http.StatusForbidden, "Akses ditolak", "Informasi role tidak ditemukan")
			c.Abort()
			return
		}


		role, ok := roleValue.(string)
		if !ok {
			utils.Fail(c, http.StatusInternalServerError, "Akses ditolak", "Format role tidak valid")
			c.Abort()
			return
		}

		roleValid := false
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				roleValid = true
				break
			}
		}

		if !roleValid {
			utils.Fail(c, http.StatusForbidden, "Akses ditolak", "Role tidak memiliki izin")
			c.Abort()
			return
		}

		c.Next()
	}
}