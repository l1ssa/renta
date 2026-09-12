package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var db *sql.DB

// postgresDSN builds a libpq connection string from either DATABASE_URL or
// the individual POSTGRES_* environment variables (see docker-compose.yml),
// falling back to sane local-dev defaults.
func postgresDSN() string {
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}
	host := os.Getenv("POSTGRES_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("POSTGRES_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("POSTGRES_USER")
	if user == "" {
		user = "renta"
	}
	password := os.Getenv("POSTGRES_PASSWORD")
	if password == "" {
		password = "renta"
	}
	name := os.Getenv("POSTGRES_DB")
	if name == "" {
		name = "renta"
	}
	sslmode := os.Getenv("POSTGRES_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", user, password, host, port, name, sslmode)
}

// initDB connects to PostgreSQL (retrying while the database container is
// still starting up), applies the schema and, on a first run with empty
// tables, imports the legacy JSON files from backend/data so an existing
// deployment doesn't lose its content.
func initDB() {
	var err error
	db, err = sql.Open("pgx", postgresDSN())
	if err != nil {
		log.Fatal(err)
	}

	for attempt := 1; attempt <= 20; attempt++ {
		if err = db.Ping(); err == nil {
			break
		}
		log.Printf("Ожидаем PostgreSQL (попытка %d/20): %v", attempt, err)
		time.Sleep(1500 * time.Millisecond)
	}
	if err != nil {
		log.Fatalf("Не удалось подключиться к PostgreSQL: %v", err)
	}

	statements := []string{
		`CREATE TABLE IF NOT EXISTS items (
			kind TEXT NOT NULL,
			id TEXT NOT NULL,
			data TEXT NOT NULL,
			created_at TEXT NOT NULL,
			PRIMARY KEY (kind, id)
		)`,
		`CREATE TABLE IF NOT EXISTS leads (
			id TEXT PRIMARY KEY,
			data TEXT NOT NULL,
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		)`,
	}
	for _, stmt := range statements {
		if _, err := db.Exec(stmt); err != nil {
			log.Fatal(err)
		}
	}
	seedFromJSON()
}

func seedFromJSON() {
	seedItems := func(kind, file string) {
		var count int
		_ = db.QueryRow(`SELECT COUNT(*) FROM items WHERE kind=$1`, kind).Scan(&count)
		if count > 0 {
			return
		}
		b, err := os.ReadFile(filepath.Join(dataDir, file))
		if err != nil {
			return
		}
		var items []Item
		if json.Unmarshal(b, &items) != nil {
			return
		}
		for _, it := range items {
			id := fmt.Sprint(it["id"])
			if id == "" || id == "<nil>" {
				id = fmt.Sprintf("%d", time.Now().UnixNano())
			}
			it["id"] = id
			data, _ := json.Marshal(it)
			_, _ = db.Exec(`INSERT INTO items(kind,id,data,created_at) VALUES($1,$2,$3,$4) ON CONFLICT (kind,id) DO NOTHING`, kind, id, string(data), time.Now().Format(time.RFC3339))
		}
		log.Printf("Заполнено %s из %s: %d записей", kind, file, len(items))
	}
	seedItems("services", "services.json")
	seedItems("products", "products.json")
	seedItems("categories", "categories.json")

	var leadCount int
	_ = db.QueryRow(`SELECT COUNT(*) FROM leads`).Scan(&leadCount)
	if leadCount == 0 {
		if b, err := os.ReadFile(filepath.Join(dataDir, "leads.json")); err == nil {
			var items []Item
			if json.Unmarshal(b, &items) == nil {
				for _, it := range items {
					id := fmt.Sprint(it["id"])
					createdAt := fmt.Sprint(it["createdAt"])
					data, _ := json.Marshal(it)
					_, _ = db.Exec(`INSERT INTO leads(id,data,created_at) VALUES($1,$2,$3) ON CONFLICT (id) DO NOTHING`, id, string(data), createdAt)
				}
			}
		}
	}

	var settingsCount int
	_ = db.QueryRow(`SELECT COUNT(*) FROM settings`).Scan(&settingsCount)
	if settingsCount == 0 {
		if b, err := os.ReadFile(filepath.Join(dataDir, "settings.json")); err == nil {
			var m map[string]any
			if json.Unmarshal(b, &m) == nil {
				for k, v := range m {
					_, _ = db.Exec(`INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT (key) DO NOTHING`, k, fmt.Sprint(v))
				}
			}
		}
	}
}

func dbListItems(kind string) ([]Item, error) {
	rows, err := db.Query(`SELECT data FROM items WHERE kind=$1 ORDER BY created_at`, kind)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Item{}
	for rows.Next() {
		var data string
		if err := rows.Scan(&data); err != nil {
			return nil, err
		}
		var it Item
		_ = json.Unmarshal([]byte(data), &it)
		out = append(out, it)
	}
	return out, nil
}

func dbInsertItem(kind string, it Item) (Item, error) {
	id := fmt.Sprintf("%d", time.Now().UnixNano())
	it["id"] = id
	if kind == "services" {
		ensureSlug(it, id)
	}
	data, _ := json.Marshal(it)
	_, err := db.Exec(`INSERT INTO items(kind,id,data,created_at) VALUES($1,$2,$3,$4)`, kind, id, string(data), time.Now().Format(time.RFC3339))
	return it, err
}

func dbUpdateItem(kind, id string, it Item) (Item, error) {
	it["id"] = id
	if kind == "services" {
		ensureSlug(it, id)
	}
	data, _ := json.Marshal(it)
	res, err := db.Exec(`UPDATE items SET data=$1 WHERE kind=$2 AND id=$3`, string(data), kind, id)
	if err != nil {
		return it, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return it, sql.ErrNoRows
	}
	return it, nil
}

func dbDeleteItem(kind, id string) error {
	res, err := db.Exec(`DELETE FROM items WHERE kind=$1 AND id=$2`, kind, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// ensureSlug fills a services item's slug from its title (transliterated)
// when the slug is missing, or normalizes a manually provided one.
func ensureSlug(it Item, id string) {
	if s, ok := it["slug"].(string); ok && strings.TrimSpace(s) != "" {
		it["slug"] = slugify(s)
		return
	}
	title, _ := it["title"].(string)
	base := slugify(title)
	if base == "" {
		base = "usluga"
	}
	suffix := id
	if len(suffix) > 5 {
		suffix = suffix[len(suffix)-5:]
	}
	it["slug"] = base + "-" + suffix
}

func slugify(s string) string {
	s = strings.ToLower(s)
	repl := map[rune]string{
		'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "e",
		'ж': "zh", 'з': "z", 'и': "i", 'й': "y", 'к': "k", 'л': "l", 'м': "m",
		'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t", 'у': "u",
		'ф': "f", 'х': "h", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "sch",
		'ъ': "", 'ы': "y", 'ь': "", 'э': "e", 'ю': "yu", 'я': "ya",
	}
	var b strings.Builder
	for _, r := range s {
		if v, ok := repl[r]; ok {
			b.WriteString(v)
			continue
		}
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			continue
		}
		b.WriteRune('-')
	}
	out := b.String()
	for strings.Contains(out, "--") {
		out = strings.ReplaceAll(out, "--", "-")
	}
	return strings.Trim(out, "-")
}
