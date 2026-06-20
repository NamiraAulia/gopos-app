package models

import (
	"time"
)

type Refund struct {
	ID            uint         `gorm:"primaryKey" json:"id"`
	TransactionID uint         `gorm:"not null" json:"transaction_id"`
	Transaction   Transaction  `gorm:"foreignKey:TransactionID" json:"transaction"`
	UserID        uint         `gorm:"not null" json:"user_id"` // Kasir/Admin yang memproses retur
	Reason        string       `gorm:"type:text;not null" json:"reason"`
	TotalRefunded int64        `gorm:"not null" json:"total_refunded"` // Total uang yang dikembalikan ke konsumen
	CreatedAt     time.Time    `json:"created_at"`
	Items         []RefundItem `gorm:"foreignKey:RefundID" json:"items"`
}

type RefundItem struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	RefundID     uint   `gorm:"not null" json:"refund_id"`
	ProductID    uint   `gorm:"not null" json:"product_id"`
	ProductName  string `gorm:"type:varchar(255);not null" json:"product_name"`
	QtyRefunded  int    `gorm:"not null" json:"qty_refunded"`
	RefundAmount int64  `gorm:"not null" json:"refund_amount"` // (UnitPrice produk saat dibeli * QtyRefunded)
}