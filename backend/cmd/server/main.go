package main

import (
	"log"
	"net/http"

	"github.com/SobolNikita/collab-editor/internal/config"
	"github.com/SobolNikita/collab-editor/internal/middleware"
)

func main() {

	cfg, err := config.GetConfig()
	if err != nil {
		log.Fatalf("Failed to get database URL: %v", err)
	}
	db, err := config.ConnectDB(&cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Hello, Go!")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Hello, Go!"))
	})

	addr := ":" + cfg.HTTPPort

	log.Println("Starting server at port ", cfg.HTTPPort)
	err = http.ListenAndServe(addr, middleware.CORS(mux))
	if err != nil {
		log.Fatal("Error starting the server:", err)
	}
}
