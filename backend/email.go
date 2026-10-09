package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"net/mail"
	"net/smtp"
	"os"
	"strings"
)

// parseRecipients разбирает получателя из настройки «Получатель заявок на
// почту»: один или несколько адресов через запятую, точку с запятой, пробел
// или перенос строки. Неверные адреса и повторы отбрасываются, порядок
// сохраняется. Проверка через net/mail заодно не пропускает переводы строк
// и прочее, что могло бы подмешать лишние заголовки в письмо.
func parseRecipients(raw string) []string {
	fields := strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == ';' || r == ' ' || r == '\t' || r == '\n' || r == '\r'
	})
	seen := map[string]bool{}
	out := []string{}
	for _, f := range fields {
		a, err := mail.ParseAddress(f)
		if err != nil || strings.ContainsAny(a.Address, "\r\n<>") {
			continue
		}
		key := strings.ToLower(a.Address)
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, a.Address)
	}
	return out
}

// notifyEmail sends a plain-text message about a new lead via SMTP (STARTTLS).
// Получатели настраиваются в админке («Настройки» → «Получатель заявок на
// почту», можно несколько через запятую), а если там пусто — берутся из
// SMTP_TO. Silently does nothing if SMTP_HOST, SMTP_USER, SMTP_PASSWORD or
// the recipient list is empty.
func notifyEmail(lead Item) {
	host := os.Getenv("SMTP_HOST")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASSWORD")
	raw := strings.TrimSpace(getSetting("notifyEmail"))
	if raw == "" {
		raw = os.Getenv("SMTP_TO")
	}
	recipients := parseRecipients(raw)
	if host == "" || user == "" || pass == "" || len(recipients) == 0 {
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

	addr := host + ":" + port
	auth := smtp.PlainAuth("", user, pass, host)
	// Каждому адресу — отдельное письмо: если один адрес неверный или сервер
	// его отклонил, остальные получатели всё равно получат уведомление.
	for _, to := range recipients {
		msg := []byte(fmt.Sprintf(
			"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n%s",
			from, to, subject, body,
		))
		if err := smtp.SendMail(addr, auth, from, []string{to}, msg); err != nil {
			log.Printf("письмо о заявке для %s не отправлено: %v", to, err)
		}
	}
}
