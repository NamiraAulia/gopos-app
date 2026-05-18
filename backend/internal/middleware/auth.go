package middleware

import (
	"fmt"
	"os"
	"strings"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gopos-backend/internal/utils"
)

func AuthMiddleware(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		utils.Fail(c, 401, "Token tidak ditemukan atau format salah", "Authorization header missing or malformed")
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
		utils.Fail(c, 401, "Token tidak valid atau kadaluwarsa", "invalid or expired token")
		c.Abort()
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		c.Set("user_id", claims["user_id"])
		c.Set("email", claims["email"])
		c.Set("role", claims["role"])
	}

	c.Next()
}

func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Fail(c, http.StatusUnauthorized, "Akses ditolak", "Token tidak ditemukan")
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		token, _ := utils.ValidateToken(tokenString) 

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			role := claims["role"].(string)

			c.Set("user_id", uint(claims["user_id"].(float64)))
			c.Set("email", claims["email"].(string))
			c.Set("role", role)

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
		} else {
			utils.Fail(c, http.StatusUnauthorized, "Akses ditolak", "Token tidak valid")
			c.Abort()
		}
	}
}
