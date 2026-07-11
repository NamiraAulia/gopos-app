package utils

import (
	"errors"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func ValidateToken(tokenString string) (*jwt.Token, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		return nil, errors.New("JWT_SECRET tidak ditemukan di environment")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode enkripsi tidak valid: %v", token.Header["alg"])
		}

		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	return token, nil
}

// GetUserID safely retrieves the user ID from the Gin context, handling various potential numeric types.
func GetUserID(c *gin.Context) (uint, bool) {
	rawUserID, exists := c.Get("user_id")
	if !exists || rawUserID == nil {
		return 0, false
	}
	switch v := rawUserID.(type) {
	case uint:
		return v, true
	case float64:
		return uint(v), true
	case int:
		return uint(v), true
	case int64:
		return uint(v), true
	}
	return 0, false
}