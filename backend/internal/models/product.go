package models

type Product struct {
	ID           uint   `json:"id" gorm:"primaryKey"`
	Name         string `json:"name"`
	Barcode      string `json:"barcode"`
	BestPrice    int    `json:"best_price"`
	Price        int    `json:"price"`
	Stock        int    `json:"stock"`
	SupplierName string `json:"supplier_name"`
	Unit         string `json:"unit"`
	IsActive     bool   `json:"is_active" gorm:"default:true"`
}

type RestockSuggestion struct {
	ProductID      uint    `json:"product_id"`
	ProductName    string  `json:"product_name"`
	CurrentStock   int     `json:"current_stock"`
	AvgSalesPerDay float64 `json:"avg_sales_per_day"`
	DaysRemaining  float64 `json:"days_remaining"`
}
