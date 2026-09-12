package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(405)
		return
	}
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB
		jsonResponse(w, 400, map[string]any{"error": "Файл слишком большой или повреждён"})
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		jsonResponse(w, 400, map[string]any{"error": "Файл не передан"})
		return
	}
	defer file.Close()
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowed[ext] {
		jsonResponse(w, 400, map[string]any{"error": "Допустимы только JPG, PNG, WEBP"})
		return
	}
	_ = os.MkdirAll(uploadsDir, 0755)
	name := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	dst, err := os.Create(filepath.Join(uploadsDir, name))
	if err != nil {
		jsonResponse(w, 500, map[string]any{"error": err.Error()})
		return
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		jsonResponse(w, 500, map[string]any{"error": err.Error()})
		return
	}
	jsonResponse(w, 200, map[string]any{"url": "/uploads/" + name})
}
