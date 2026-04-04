package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/SobolNikita/collab-editor/internal/config"
	"github.com/SobolNikita/collab-editor/internal/handler"
	"github.com/SobolNikita/collab-editor/internal/repository"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func enableCORS(next http.Handler) http.Handler {
	allowedOrigins := os.Getenv("CORS_ORIGIN")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			if allowedOrigins == "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				for _, o := range strings.Split(allowedOrigins, ",") {
					if strings.TrimSpace(o) == origin {
						w.Header().Set("Access-Control-Allow-Origin", origin)
						break
					}
				}
			}
		}
		if w.Header().Get("Access-Control-Allow-Origin") == "" {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	handler.SetDB(db)
	repository.SetDB(db)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		handler.Login(w, r)
	})
	mux.HandleFunc("POST /api/auth/register", func(w http.ResponseWriter, r *http.Request) {
		handler.Register(w, r)
	})
	mux.HandleFunc("POST /api/files", func(w http.ResponseWriter, r *http.Request) {
		handler.CreateFile(w, r)
	})
	mux.HandleFunc("POST /api/run", func(w http.ResponseWriter, r *http.Request) {
		handler.Run(w, r)
	})
	mux.HandleFunc("GET /api/auth/google", func(w http.ResponseWriter, r *http.Request) {
		handler.GoogleAuth(w, r)
	})
	mux.HandleFunc("GET /api/auth/google/callback", func(w http.ResponseWriter, r *http.Request) {
		handler.GoogleCallback(w, r)
	})
	mux.HandleFunc("GET /api/auth/callback/google", func(w http.ResponseWriter, r *http.Request) {
		handler.GoogleCallback(w, r)
	})
	mux.HandleFunc("GET /api/files/by-code/{code}", func(w http.ResponseWriter, r *http.Request) {
		handler.JoinByCode(w, r)
	})
	mux.HandleFunc("GET /api/rooms/{roomCode}/participants", func(w http.ResponseWriter, r *http.Request) {
		handler.GetRoomParticipants(w, r)
	})
	mux.HandleFunc("GET /api/rooms/{roomId}/permissions", func(w http.ResponseWriter, r *http.Request) {
		handler.GetRoomPermissions(w, r)
	})

	mux.HandleFunc("GET /api/rooms", func(w http.ResponseWriter, r *http.Request) {
		handler.GetMyRooms(w, r)
	})
	mux.HandleFunc("DELETE /api/rooms/{roomCode}", func(w http.ResponseWriter, r *http.Request) {
		handler.DeleteRoom(w, r)
	})

	mux.HandleFunc("GET /api/rooms/{roomName}/doc", func(w http.ResponseWriter, r *http.Request) {
		handler.GetDoc(w, r)
	})
	mux.HandleFunc("PUT /api/rooms/{roomName}/doc", func(w http.ResponseWriter, r *http.Request) {
		handler.SaveDoc(w, r)
	})

	handler := enableCORS(mux)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server is running on %s", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}
