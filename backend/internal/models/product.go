package models

import "time"

type Product struct {
	ID             uint       `json:"id" gorm:"primaryKey"`
	Name           string     `json:"name"`
	Barcode        string     `json:"barcode"`
	BestPrice      int        `json:"best_price"`
	Price          int        `json:"price"`
	PriceBig       int        `json:"price_big"`
	Stock          float64    `json:"stock"`
	MinStock       int        `json:"min_stock" gorm:"default:5"`
	SupplierName   string     `json:"supplier_name"`
	Conversion     int        `json:"conversion"`
	Unit           string     `json:"unit"`
	UnitBig        string     `json:"unit_big"`
	IsActive       bool       `json:"is_active" gorm:"default:true"`
	DiscountAmount int        `json:"discount_amount" gorm:"default:0"`
	IsPromo        bool       `json:"is_promo" gorm:"default:false"`
	PriceMember    int        `json:"price_member" gorm:"default:0"`
	ShelfLifeDays  int        `json:"shelf_life_days" gorm:"default:0"`
	ExpiryDate     *time.Time `json:"expiry_date"`
}

type RestockSuggestion struct {
	ProductID       uint       `json:"product_id"`
	ProductName     string     `json:"product_name"`
	CurrentStock    float64    `json:"current_stock"`
	AvgSalesPerDay  float64    `json:"avg_sales_per_day"`
	DaysRemaining   float64    `json:"days_remaining"`
	SupplierName    string     `json:"supplier_name"`
	Conversion      int        `json:"conversion"`
	Unit            string     `json:"unit"`
	UnitBig         string     `json:"unit_big"`
	ShelfLifeDays   int        `json:"shelf_life_days"`
	ExpiryDate      *time.Time `json:"expiry_date"`
	DailyDemand     float64    `json:"daily_demand"`
	WeeklyDemand    float64    `json:"weekly_demand"`
	RecommendQty    int        `json:"recommend_qty"`
	RecommendBigQty int        `json:"recommend_big_qty"`
	MaxSafeQty      int        `json:"max_safe_qty"`
	MaxSafeBigQty   int        `json:"max_safe_big_qty"`
	RiskTier        string     `json:"risk_tier"`
}

type StockAdjustment struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ProductID  uint      `json:"product_id"`
	UserID     uint      `json:"user_id"`
	Type       string    `gorm:"size:20" json:"type"`
	Qty        float64   `json:"qty"`
	StockAfter float64   `json:"stock_after"`
	Reason     string    `gorm:"size:255" json:"reason"`
	CreatedAt  time.Time `json:"created_at"`
}

type StockAdjustmentInput struct {
	ProductID uint    `json:"product_id" binding:"required"`
	Type      string  `json:"type"       binding:"required,oneof=in out correction"`
	Qty       float64 `json:"qty"        binding:"required,gt=0"`
	Reason    string  `json:"reason"     binding:"required"`
}
