package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gopos-backend/internal/utils"
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

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode signatur tidak valid")
		}
		return jwtKey, nil
	})

	if err != nil || !token.Valid {
		utils.Fail(c, http.StatusUnauthorized, "Token tidak valid atau kadaluwarsa", "invalid or expired token")
		c.Abort()
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		if userIdFloat, ok := claims["user_id"].(float64); ok {
			c.Set("user_id", uint(userIdFloat))
		} else {
			utils.Fail(c, http.StatusUnauthorized, "Token tidak valid", "invalid user_id data type in token")
			c.Abort()
			return
		}
		if email, ok := claims["email"].(string); ok {
			c.Set("email", email)
		}
		if role, ok := claims["role"].(string); ok {
			c.Set("role", role)
		}
	}

	c.Next()
}

func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleValue, exists := c.Get("role")
		if !exists {
			utils.Fail(c, http.StatusUnauthorized, "Akses ditolak", "Informasi role tidak ditemukan")
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