package models

import "time"

type DebtLog struct {
	ID            uint         `gorm:"primaryKey" json:"id"`
	MemberID      uint         `gorm:"not null;index" json:"member_id"`
	Member        *Member      `gorm:"foreignKey:MemberID" json:"member"`
	TransactionID *uint        `gorm:"index" json:"transaction_id"`
	Transaction   *Transaction `gorm:"foreignKey:TransactionID" json:"transaction"`
	Type          string       `gorm:"type:varchar(20);not null" json:"type"` // "kasbon" | "repayment"
	Amount        int64        `gorm:"not null" json:"amount"`                 // Nominal utang baru / nominal cicilan
	DownPayment   int64        `gorm:"default:0" json:"down_payment"`         // Uang muka saat checkout (jika ada)
	RemainingDebt int64        `gorm:"not null" json:"remaining_debt"`         // Sisa utang member setelah transaksi ini
	PaymentMethod string       `gorm:"type:varchar(20);default:'cash'" json:"payment_method"` // "cash" | "qris" | "transfer" | "kasbon"
	Notes         string       `gorm:"type:varchar(255)" json:"notes"`
	UserID        uint         `gorm:"not null" json:"user_id"`
	User          *User        `gorm:"foreignKey:UserID" json:"user"`
	CreatedAt     time.Time    `json:"created_at"`
	DueDate       *time.Time   `json:"due_date"`
}

type RepayInput struct {
	AmountPaid    int64  `json:"amount_paid" binding:"required,gt=0"`
	PaymentMethod string `json:"payment_method" binding:"required,oneof=cash qris transfer"`
	Notes         string `json:"notes"`
}
