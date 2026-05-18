package models

type User struct {
	ID       uint   `gorm:"primaryKey"                       json:"id"`
	Name     string `gorm:"type:varchar(100)"                json:"name"`
	Email    string `gorm:"unique"                           json:"email"`
	Password string `                                        json:"-"`
	Role     string `gorm:"type:varchar(20);default:'kasir'" json:"role"`
	IsActive bool   `gorm:"default:true"                     json:"is_active"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type CreateUserInput struct {
	Name     string `json:"name"     binding:"required"`
	Email    string `json:"email"    binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role"     binding:"required"`
}
