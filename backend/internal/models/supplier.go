package models

import "time"

type VisitType string

const (
	VisitTakingOrder VisitType = "taking_order"
	VisitBilling     VisitType = "billing"
	VisitBoth        VisitType = "both"
)

type Supplier struct {
	ID            uint            `json:"id" gorm:"primaryKey"`
	Name          string          `json:"name" gorm:"not null"`
	Address       string          `json:"address"`
	Notes         string          `json:"notes"`
	IsActive      bool            `json:"is_active" gorm:"default:true"`
	SalesContacts []SupplierSales `json:"sales_contacts" gorm:"foreignKey:SupplierID"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

type SupplierSales struct {
	ID            uint       `json:"id" gorm:"primaryKey"`
	SupplierID    uint       `json:"supplier_id" gorm:"not null"`
	SalesName     string     `json:"sales_name" gorm:"not null"`
	Category      string     `json:"category"`
	PhoneNumber   string     `json:"phone_number"`
	VisitDay      string     `json:"visit_day"` // Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
	VisitType     VisitType  `json:"visit_type" gorm:"default:'both'"`
	Notes         string     `json:"notes"`
	IsActive      bool       `json:"is_active" gorm:"default:true"`
	LastVisitedAt *time.Time `json:"last_visited_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type CreateSupplierInput struct {
	Name          string                    `json:"name" binding:"required"`
	Address       string                    `json:"address"`
	Notes         string                    `json:"notes"`
	SalesContacts []CreateSupplierSalesInput `json:"sales_contacts"`
}

type CreateSupplierSalesInput struct {
	ID          uint      `json:"id"`
	SalesName   string    `json:"sales_name" binding:"required"`
	Category    string    `json:"category"`
	PhoneNumber string    `json:"phone_number"`
	VisitDay    string    `json:"visit_day" binding:"required"`
	VisitType   VisitType `json:"visit_type"`
	Notes       string    `json:"notes"`
}
