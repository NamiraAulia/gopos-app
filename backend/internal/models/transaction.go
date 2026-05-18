package models

import "time"

type CheckoutInput struct {
	ProductID uint  `json:"product_id" binding:"required"`
	Qty       int   `json:"qty"        binding:"required,min=1"`
	UnitPrice int64 `json:"unit_price" binding:"required"`
}

type CheckoutRequest struct {
	Items         []CheckoutInput `json:"items"          binding:"required,min=1"`
	PaymentMethod string          `json:"payment_method" binding:"required,oneof=cash qris transfer"`
	AmountPaid    int64           `json:"amount_paid"    binding:"required,min=1"`
}
type Transaction struct {
	ID              uint              `gorm:"primaryKey" json:"id"`
	TransactionCode string            `gorm:"uniqueIndex;size:50" json:"transaction_code"`
	UserID          uint              `json:"user_id"`
	TotalAmount     int64             `json:"total_amount"`
	PaymentMethod   string            `gorm:"size:30" json:"payment_method"`
	AmountPaid      int64             `json:"amount_paid"`
	ChangeAmount    int64             `json:"change_amount"`
	Status          string            `gorm:"size:20;default:completed" json:"status"`
	Items           []TransactionItem `gorm:"foreignKey:TransactionID" json:"items"`
	CreatedAt       time.Time         `json:"created_at"`
}

type TransactionItem struct {
	ID            uint   `json:"id"             gorm:"primaryKey"`
	TransactionID uint   `json:"transaction_id"`
	ProductID     uint   `json:"product_id"`
	ProductName   string `json:"product_name"`
	UnitPrice     int64  `json:"unit_price"`
	Qty           int    `json:"qty"`
	Subtotal      int64  `json:"subtotal"`
}
