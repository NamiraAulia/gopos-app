package utils

import (
	"gopos-backend/internal/database"
	"gopos-backend/internal/models"
	"gorm.io/gorm"
)

func RecordActivity(tx *gorm.DB, userID uint, action, table string, targetID uint, oldVal, newVal, ip string) error {
	if tx == nil {
		tx = database.DB
	}

	log := models.ActivityLog{
		UserID:      userID,
		Action:      action,
		TargetTable: table,
		TargetID:    targetID,
		OldValue:    oldVal,
		NewValue:    newVal,
		IPAddress:   ip,
	}

	return tx.Create(&log).Error
}