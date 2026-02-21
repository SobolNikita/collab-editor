package config

import (
	"database/sql"
	"errors"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	HTTPPort    string
}

func GetConfig() (Config, error) {
	err := godotenv.Load("../.env")
	if err != nil {
		return Config{}, err
	}
	connStr := os.Getenv("DATABASE_URL")
	httpPort := os.Getenv("HTTP_PORT")
	if connStr == "" {
		return Config{}, errors.New("DATABASE_URL is not set")
	}
	if httpPort == "" {
		httpPort = "8080"
	}
	return Config{
		DatabaseURL: connStr,
		HTTPPort:    httpPort,
	}, nil
}

func ConnectDB(cfg *Config) (*sql.DB, error) {
	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}
