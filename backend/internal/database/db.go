package database

import (
	"fmt"
	"log"
	"os"

	"gopos-backend/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)
var DB *gorm.DB

func ConnectDB() {
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		dbHost, dbUser, dbPass, dbName, dbPort)

	var err error
	DB, err = gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger:      logger.Default.LogMode(logger.Info),
		PrepareStmt: false,
	})



	if err != nil {
		log.Fatal("Gagal terhubung ke PostgreSQL: ", err)
	}

	log.Println("Database PostgreSQL berhasil terkoneksi!")

	err = DB.AutoMigrate(
		&models.Product{},
		&models.Transaction{},
		&models.TransactionItem{},
		&models.User{},
		&models.Expense{},
		&models.Shift{},
		&models.ActivityLog{},
		&models.Refund{},
		&models.RefundItem{},
		&models.Member{},
		&models.StockAdjustment{},
		&models.DebtLog{},
		&models.Supplier{},
		&models.SupplierSales{},
	)
	if err != nil {
		log.Fatal("Gagal migrasi database: ", err)
	}

	// Alter table columns to support double precision for decimal stock and quantities
	DB.Exec("ALTER TABLE products ALTER COLUMN stock TYPE double precision")
	DB.Exec("ALTER TABLE transaction_items ALTER COLUMN qty TYPE double precision")
	DB.Exec("ALTER TABLE refund_items ALTER COLUMN qty_refunded TYPE double precision")
	DB.Exec("ALTER TABLE stock_adjustments ALTER COLUMN qty TYPE double precision")
	DB.Exec("ALTER TABLE stock_adjustments ALTER COLUMN stock_after TYPE double precision")
	DB.Exec("ALTER TABLE members ADD COLUMN IF NOT EXISTS total_debt bigint DEFAULT 0")
	DB.Exec("ALTER TABLE members ADD COLUMN IF NOT EXISTS last_debt_at timestamp")
	DB.Exec("ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id bigint")

	createIndexes()
}

func SeedAdmin() {
	var count int64
	DB.Model(&models.User{}).Count(&count)

	if count == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Password123"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatal("Gagal melakukan hash password seeder:", err)
		}

		admin := models.User{
			Name:     "Admin1",
			Email:    "admin1@example.com",
			Password: string(hashedPassword),
			Role:     "admin",
			IsActive: true,
		}

		if err := DB.Create(&admin).Error; err != nil {
			log.Println("Gagal membuat seed admin:", err)
		} else {
			log.Println("Database kosong! Berhasil membuat akun Admin default: admin1@example.com / Admin123")
		}
	}
}

func createIndexes() {
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_tx_items_transaction_id ON transaction_items(transaction_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_tx_items_product_id ON transaction_items(product_id)")
	
	// Drop old non-unique index and create a UNIQUE index
	DB.Exec("DROP INDEX IF EXISTS idx_products_barcode")
	DB.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)")

	// Pembersihan aman data legacy: jika ada data ganda shift 'open' untuk user yang sama, tutup shift lama secara otomatis
	DB.Exec(`
		UPDATE shifts 
		SET status = 'closed', 
		    end_time = CURRENT_TIMESTAMP,
		    cash_difference = 0
		WHERE status = 'open' 
		  AND id NOT IN (
		      SELECT MAX(id) 
		      FROM shifts 
		      WHERE status = 'open' 
		      GROUP BY user_id
		  );
	`)

	// Create a unique partial index to ensure at most one active shift per user
	DB.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_user_open_unique ON shifts (user_id) WHERE status = 'open'")
}