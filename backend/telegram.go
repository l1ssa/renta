package main

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
)

// notifyTelegram sends a plain-text message about a new lead to the chat
// configured via TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID. Silently does nothing
// if either is unset, so the site keeps working before those are configured.
func notifyTelegram(lead Item) {
	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	chatID := os.Getenv("TELEGRAM_CHAT_ID")
	if token == "" || chatID == "" {
		return
	}
	msg := fmt.Sprintf("Новая заявка с сайта РЕНТА\nИмя: %v\nТелефон: %v\nСообщение: %v",
		lead["name"], lead["phone"], orDash(lead["message"]))
	form := url.Values{}
	form.Set("chat_id", chatID)
	form.Set("text", msg)
	resp, err := http.PostForm(fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token), form)
	if err != nil {
		return
	}
	defer resp.Body.Close()
}

func orDash(v any) any {
	if v == nil || v == "" {
		return "—"
	}
	return v
}
