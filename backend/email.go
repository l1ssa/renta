package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

// notifyEmail sends a plain-text message about a new lead via SMTP (STARTTLS).
// Silently does nothing if SMTP_HOST, SMTP_USER, SMTP_PASSWORD or SMTP_TO is unset.
func notifyEmail(lead Item) {
	host := os.Getenv("SMTP_HOST")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASSWORD")
	to := os.Getenv("SMTP_TO")
	if host == "" || user == "" || pass == "" || to == "" {
		return
	}
	port := os.Getenv("SMTP_PORT")
	if port == "" {
		port = "587"
	}
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = user
	}

	subject := "=?UTF-8?B?" + base64.StdEncoding.EncodeToString([]byte("Новая заявка с сайта РЕНТА")) + "?="
	body := fmt.Sprintf("Имя: %v\r\nТелефон: %v\r\nСообщение: %v\r\n",
		lead["name"], lead["phone"], orDash(lead["message"]))

	var msg strings.Builder
	msg.WriteString("From: " + from + "\r\n")
	msg.WriteString("To: " + to + "\r\n")
	msg.WriteString("Subject: " + subject + "\r\n")
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	msg.WriteString("Content-Transfer-Encoding: 8bit\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(body)

	auth := smtp.PlainAuth("", user, pass, host)
	if err := smtp.SendMail(host+":"+port, auth, from, []string{to}, []byte(msg.String())); err != nil {
		log.Printf("письмо о заявке не отправлено: %v", err)
	}
}
