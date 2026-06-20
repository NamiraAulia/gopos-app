package models

import (
	"time"
)

type ActivityLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID" json:"user"`
	Action      string    `gorm:"type:varchar(50);not null" json:"action"`       
	TargetTable string    `gorm:"type:varchar(50);not null" json:"target_table"` 
	TargetID    uint      `gorm:"not null" json:"target_id"`                  
	OldValue    string    `gorm:"type:text" json:"old_value"`                   
	NewValue    string    `gorm:"type:text" json:"new_value"`                    
	IPAddress   string    `gorm:"type:varchar(45)" json:"ip_address"`
	CreatedAt   time.Time `json:"created_at"`
}