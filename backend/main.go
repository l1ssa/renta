package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

type Item map[string]any

const dataDir = "data"
const uploadsDir = "uploads"

func jsonResponse(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

// cors reflects the request Origin (required when Allow-Credentials is used,
// since the wildcard "*" is not permitted together with credentialed requests).
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		if r.Method == "OPTIONS" {
			w.WriteHeader(204)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// crudHandler serves list/create/update/delete for a given "kind" of item
// stored in the generic items table (services or products). GET is public,
// all other methods require an authenticated admin session.
func crudHandler(kind string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" && !isAuthed(r) {
			jsonResponse(w, 401, map[string]any{"error": "Требуется авторизация"})
			return
		}
		switch r.Method {
		case "GET":
			items, err := dbListItems(kind)
			if err != nil {
				jsonResponse(w, 500, map[string]any{"error": err.Error()})
				return
			}
			if kind == "products" && r.URL.Query().Get("all") != "1" {
				visible := []Item{}
				for _, it := range items {
					if v, ok := it["active"]; !ok || v == true {
						visible = append(visible, it)
					}
				}
				items = visible
			}
			jsonResponse(w, 200, items)
		case "POST":
			var x Item
			if json.NewDecoder(r.Body).Decode(&x) != nil {
				jsonResponse(w, 400, map[string]any{"error": "Неверный JSON"})
				return
			}
			out, err := dbInsertItem(kind, x)
			if err != nil {
				jsonResponse(w, 500, map[string]any{"error": err.Error()})
				return
			}
			jsonResponse(w, 201, out)
		case "PUT":
			id := r.URL.Query().Get("id")
			var x Item
			if json.NewDecoder(r.Body).Decode(&x) != nil {
				jsonResponse(w, 400, map[string]any{"error": "Неверный JSON"})
				return
			}
			out, err := dbUpdateItem(kind, id, x)
			if err == sql.ErrNoRows {
				jsonResponse(w, 404, map[string]any{"error": "Не найдено"})
				return
			}
			if err != nil {
				jsonResponse(w, 500, map[string]any{"error": err.Error()})
				return
			}
			jsonResponse(w, 200, out)
		case "DELETE":
			id := r.URL.Query().Get("id")
			err := dbDeleteItem(kind, id)
			if err == sql.ErrNoRows {
				jsonResponse(w, 404, map[string]any{"error": "Не найдено"})
				return
			}
			if err != nil {
				jsonResponse(w, 500, map[string]any{"error": err.Error()})
				return
			}
			jsonResponse(w, 200, map[string]any{"ok": true})
		default:
			w.WriteHeader(405)
		}
	}
}

// leadsHandler: POST is the public consultation form (requires the consent +
// offer checkboxes), GET (admin list) requires an authenticated session.
func leadsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		var x Item
		if json.NewDecoder(r.Body).Decode(&x) != nil {
			jsonResponse(w, 400, map[string]any{"error": "Неверные данные"})
			return
		}
		if x["consent"] != true || x["offerAccepted"] != true {
			jsonResponse(w, 400, map[string]any{"error": "Нужно согласие на обработку персональных данных и оферту"})
			return
		}
		id := fmt.Sprintf("%d", time.Now().UnixNano())
		x["id"] = id
		createdAt := time.Now().Format(time.RFC3339)
		x["createdAt"] = createdAt
		data, _ := json.Marshal(x)
		if _, err := db.Exec(`INSERT INTO leads(id,data,created_at) VALUES($1,$2,$3)`, id, string(data), createdAt); err != nil {
			jsonResponse(w, 500, map[string]any{"error": err.Error()})
			return
		}
		go notifyTelegram(x)
		jsonResponse(w, 201, map[string]any{"ok": true, "message": "Заявка отправлена"})
		return
	}
	if !isAuthed(r) {
		jsonResponse(w, 401, map[string]any{"error": "Требуется авторизация"})
		return
	}
	rows, err := db.Query(`SELECT data FROM leads ORDER BY created_at DESC`)
	if err != nil {
		jsonResponse(w, 500, map[string]any{"error": err.Error()})
		return
	}
	defer rows.Close()
	items := []Item{}
	for rows.Next() {
		var data string
		if rows.Scan(&data) != nil {
			continue
		}
		var it Item
		_ = json.Unmarshal([]byte(data), &it)
		items = append(items, it)
	}
	jsonResponse(w, 200, items)
}

func settingsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "PUT" {
		var x map[string]any
		if json.NewDecoder(r.Body).Decode(&x) != nil {
			jsonResponse(w, 400, map[string]any{"error": "Неверный JSON"})
			return
		}
		tx, err := db.Begin()
		if err != nil {
			jsonResponse(w, 500, map[string]any{"error": err.Error()})
			return
		}
		_, _ = tx.Exec(`DELETE FROM settings`)
		for k, v := range x {
			_, _ = tx.Exec(`INSERT INTO settings(key,value) VALUES($1,$2)`, k, fmt.Sprint(v))
		}
		if err := tx.Commit(); err != nil {
			jsonResponse(w, 500, map[string]any{"error": err.Error()})
			return
		}
		jsonResponse(w, 200, x)
		return
	}
	rows, err := db.Query(`SELECT key,value FROM settings`)
	if err != nil {
		jsonResponse(w, 500, map[string]any{"error": err.Error()})
		return
	}
	defer rows.Close()
	out := map[string]any{}
	for rows.Next() {
		var k, v string
		if rows.Scan(&k, &v) != nil {
			continue
		}
		out[k] = v
	}
	jsonResponse(w, 200, out)
}

func statsHandler(w http.ResponseWriter, r *http.Request) {
	var leadCount, serviceCount, productCount int
	_ = db.QueryRow(`SELECT COUNT(*) FROM leads`).Scan(&leadCount)
	_ = db.QueryRow(`SELECT COUNT(*) FROM items WHERE kind='services'`).Scan(&serviceCount)
	_ = db.QueryRow(`SELECT COUNT(*) FROM items WHERE kind='products'`).Scan(&productCount)
	// Посещения — пока заглушка. Подключите Яндекс.Метрику и передавайте
	// реальные цифры сюда же, либо просматривайте статистику прямо в Метрике.
	jsonResponse(w, 200, map[string]any{
		"visitsToday": 128, "visitsWeek": 846, "visitsMonth": 3241,
		"leads": leadCount, "services": serviceCount, "products": productCount,
	})
}

func main() {
	_ = os.MkdirAll(dataDir, 0755)
	_ = os.MkdirAll(uploadsDir, 0755)
	initDB()
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/services", crudHandler("services"))
	mux.HandleFunc("/api/products", crudHandler("products"))
	mux.HandleFunc("/api/categories", crudHandler("categories"))
	mux.HandleFunc("/api/about", crudHandler("about"))
	mux.HandleFunc("/api/leads", leadsHandler)
	mux.HandleFunc("/api/settings", requireAuth(settingsHandler))
	mux.HandleFunc("/api/stats", requireAuth(statsHandler))
	mux.HandleFunc("/api/upload", requireAuth(uploadHandler))
	mux.HandleFunc("/api/login", loginHandler)
	mux.HandleFunc("/api/logout", logoutHandler)
	mux.HandleFunc("/api/me", meHandler)
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		jsonResponse(w, 200, map[string]string{"status": "ok"})
	})
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir))))

	srv := &http.Server{Addr: ":8080", Handler: cors(mux)}
	log.Println("API http://localhost:8080")
	log.Fatal(srv.ListenAndServe())
}
