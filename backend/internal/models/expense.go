package models

import "time"

type Expense struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"user_id"`
	Name      string    `json:"name"`
	Amount    int64     `json:"amount"`
	Category  string    `json:"category"`
	CreatedAt time.Time `json:"created_at"`
}
type AddExpenseInput struct {
	Name     string `json:"name"     binding:"required"`
	Amount   int64  `json:"amount"   binding:"required,min=1"`
	Category string `json:"category" binding:"required"`
}
