package utils

import (
	"fmt"
	"net/smtp"
)

func SendResetPasswordEmail(toEmail string, resetToken string) error {
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	
	senderEmail := "namirasdrmn@gmail.com" 
	senderPassword := "xxxx xxxx xxxx xxxx" 

	auth := smtp.PlainAuth("", senderEmail, senderPassword, smtpHost)

	subject := "Subject: Reset Password Akun GoPOS\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	
	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", resetToken)
	
	body := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
			<h2 style="color: #2563eb;">Reset Password GoPOS</h2>
			<p>Halo,</p>
			<p>Kami menerima permintaan untuk mereset password akun Anda. Silakan klik tombol di bawah ini untuk membuat password baru:</p>
			<a href="%s" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #2563eb; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0;">Reset Password Saya</a>
			<p style="font-size: 12px; color: #64748b;">Link ini hanya berlaku selama 15 menit. Jika Anda tidak meminta reset password, abaikan email ini.</p>
		</div>
	`, resetLink)

	msg := []byte(subject + mime + body)

	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, senderEmail, []string{toEmail}, msg)
	return err
}