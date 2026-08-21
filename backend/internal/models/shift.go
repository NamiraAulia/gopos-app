package models

import (
	"time"
)

type Shift struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	UserID            uint       `gorm:"not null" json:"user_id"`
	User              User       `gorm:"foreignKey:UserID" json:"user"`
	StartTime         time.Time  `gorm:"not null" json:"start_time"`
	EndTime           *time.Time `json:"end_time"` 
	StartCash         int64      `gorm:"not null" json:"start_cash"`
	TotalCashExpected int64      `gorm:"not null" json:"total_cash_expected"`
	TotalCashActual   int64      `gorm:"default:0" json:"total_cash_actual"`
	CashDifference    int64      `gorm:"default:0" json:"cash_difference"`
	Status            string     `gorm:"type:varchar(10);default:'open'" json:"status"` 
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	TotalRefundedCash int64      `gorm:"default:0" json:"total_refunded_cash"`
	TotalExpenseCash  int64      `gorm:"default:0" json:"total_expense_cash"`
}