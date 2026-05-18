package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response is the standard JSON envelope for all API responses.
//
//   - OK  writes HTTP 200 with success=true; the error field is omitted (omitempty).
//   - Fail writes the given statusCode with success=false; the data field is omitted (omitempty).
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// OK writes an HTTP 200 response with success=true, the given message, and data.
// The error field is omitted from the JSON output.
func OK(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Fail writes an HTTP response with the given statusCode, success=false, message, and err string.
// The data field is omitted from the JSON output.
func Fail(c *gin.Context, statusCode int, message string, err string) {
	c.JSON(statusCode, Response{
		Success: false,
		Message: message,
		Error:   err,
	})
}

// ---------------------------------------------------------------------------
// Legacy helpers — kept for backward compatibility while handlers are migrated.
// These will be removed once all handlers are rewritten to use OK / Fail.
// ---------------------------------------------------------------------------

// APIResponse is the legacy response envelope. Use Response instead.
//
// Deprecated: use Response with OK / Fail.
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Error   interface{} `json:"error"`
}

// Success returns a legacy APIResponse with success=true.
//
// Deprecated: use OK instead.
func Success(message string, data interface{}) APIResponse {
	return APIResponse{
		Success: true,
		Message: message,
		Data:    data,
		Error:   nil,
	}
}

// Error returns a legacy APIResponse with success=false.
//
// Deprecated: use Fail instead.
func Error(message string, err string) APIResponse {
	return APIResponse{
		Success: false,
		Message: message,
		Data:    nil,
		Error:   err,
	}
}
