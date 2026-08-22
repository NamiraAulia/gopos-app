package models

import "time"

type Member struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	MemberCode string     `gorm:"type:varchar(50);uniqueIndex;not null" json:"member_code"`
	Name       string     `gorm:"type:varchar(100);not null" json:"name"`
	Phone      string     `gorm:"type:varchar(20)" json:"phone"`
	TotalDebt  int64      `gorm:"default:0" json:"total_debt"`
	LastDebtAt *time.Time `json:"last_debt_at"`
	IsActive   bool       `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time  `json:"created_at"`
}

type CreateMemberInput struct {
	Name  string `json:"name" binding:"required"`
	Phone string `json:"phone"`
}
