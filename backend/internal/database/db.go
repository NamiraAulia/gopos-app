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
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), 
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
	)
	if err != nil {
		log.Fatal("Gagal migrasi database: ", err)
	}

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
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)")
}