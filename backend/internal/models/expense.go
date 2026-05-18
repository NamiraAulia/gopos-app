package models

import "time"

type Expense struct {
    ID          uint      `gorm:"primaryKey" json:"id"`
    Name        string    `json:"name"`  
    Amount      int64     `json:"amount"` 
    Category    string    `json:"category"`
    CreatedAt   time.Time `json:"created_at"`
}