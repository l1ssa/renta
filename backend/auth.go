package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// --- Защита /api/login от подбора пароля ---
// После нескольких неверных попыток с одного IP вход блокируется на время.
// Без этого пароль админки можно подбирать перебором без ограничений.
const (
	maxLoginAttempts = 5
	loginLockout     = 15 * time.Minute
)

type loginAttemptState struct {
	count       int
	lockedUntil time.Time
}

var (
	loginAttemptsMu sync.Mutex
	loginAttempts   = map[string]*loginAttemptState{}
)

// clientIP учитывает X-Forwarded-For: в проде перед backend стоит Caddy, и
// r.RemoteAddr иначе всегда был бы адресом самого Caddy.
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func loginRateLimited(ip string) (bool, time.Duration) {
	loginAttemptsMu.Lock()
	defer loginAttemptsMu.Unlock()
	st := loginAttempts[ip]
	if st == nil || !time.Now().Before(st.lockedUntil) {
		return false, 0
	}
	return true, time.Until(st.lockedUntil)
}

func recordLoginFailure(ip string) {
	loginAttemptsMu.Lock()
	defer loginAttemptsMu.Unlock()
	st := loginAttempts[ip]
	if st == nil {
		st = &loginAttemptState{}
		loginAttempts[ip] = st
	}
	st.count++
	if st.count >= maxLoginAttempts {
		st.lockedUntil = time.Now().Add(loginLockout)
		st.count = 0
	}
}

func recordLoginSuccess(ip string) {
	loginAttemptsMu.Lock()
	defer loginAttemptsMu.Unlock()
	delete(loginAttempts, ip)
}

// ВАЖНО: перед реальным запуском задайте ADMIN_PASSWORD и ADMIN_SECRET через
// переменные окружения (см. docker-compose.yml) — значения по умолчанию
// нужны только для локального теста.
func adminPassword() string {
	if p := os.Getenv("ADMIN_PASSWORD"); p != "" {
		return p
	}
	return "renta-admin-2026"
}

func sessionSecret() []byte {
	if s := os.Getenv("ADMIN_SECRET"); s != "" {
		return []byte(s)
	}
	return []byte("renta-dev-secret-change-me")
}

func signToken(expiresAt int64) string {
	payload := strconv.FormatInt(expiresAt, 10)
	mac := hmac.New(sha256.New, sessionSecret())
	mac.Write([]byte(payload))
	return payload + "." + hex.EncodeToString(mac.Sum(nil))
}

func verifyToken(token string) bool {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return false
	}
	mac := hmac.New(sha256.New, sessionSecret())
	mac.Write([]byte(parts[0]))
	expected := hex.EncodeToString(mac.Sum(nil))
	if subtle.ConstantTimeCompare([]byte(parts[1]), []byte(expected)) != 1 {
		return false
	}
	exp, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return false
	}
	return time.Now().Unix() < exp
}

func isAuthed(r *http.Request) bool {
	c, err := r.Cookie("renta_session")
	if err != nil {
		return false
	}
	return verifyToken(c.Value)
}

func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !isAuthed(r) {
			jsonResponse(w, 401, map[string]any{"error": "Требуется авторизация"})
			return
		}
		next(w, r)
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(405)
		return
	}
	ip := clientIP(r)
	if locked, wait := loginRateLimited(ip); locked {
		jsonResponse(w, 429, map[string]any{"error": "Слишком много попыток. Попробуйте через " + strconv.Itoa(int(wait.Minutes())+1) + " мин."})
		return
	}
	var body struct {
		Password string `json:"password"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil {
		jsonResponse(w, 400, map[string]any{"error": "Неверные данные"})
		return
	}
	if subtle.ConstantTimeCompare([]byte(body.Password), []byte(adminPassword())) != 1 {
		recordLoginFailure(ip)
		jsonResponse(w, 401, map[string]any{"error": "Неверный пароль"})
		return
	}
	recordLoginSuccess(ip)
	exp := time.Now().Add(12 * time.Hour).Unix()
	http.SetCookie(w, &http.Cookie{
		Name:     "renta_session",
		Value:    signToken(exp),
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(exp, 0),
	})
	jsonResponse(w, 200, map[string]any{"ok": true})
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "renta_session", Value: "", Path: "/", MaxAge: -1})
	jsonResponse(w, 200, map[string]any{"ok": true})
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, 200, map[string]any{"authed": isAuthed(r)})
}
