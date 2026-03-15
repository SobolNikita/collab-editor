package config

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	Judge0URL          string
	XAuthToken         string
}

func Load() (Config, error) {

	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatalf("Error while loading .env file: %v", err)
	}
	port := os.Getenv("HTTP_PORT")
	databaseURL := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	googleRedirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
	judge0URL := os.Getenv("JUDGE0_URL")
	xAuthToken := os.Getenv("X_AUTH_TOKEN")

	if port == "" || databaseURL == "" || jwtSecret == "" || googleClientID == "" || googleClientSecret == "" || googleRedirectURL == "" || judge0URL == "" || xAuthToken == "" {
		return Config{}, errors.New("Error while loading environment variables")
	}

	return Config{
		Port:               port,
		DatabaseURL:        databaseURL,
		JWTSecret:          jwtSecret,
		GoogleClientID:     googleClientID,
		GoogleClientSecret: googleClientSecret,
		GoogleRedirectURL:  googleRedirectURL,
		Judge0URL:          judge0URL,
		XAuthToken:         xAuthToken,
	}, nil
}
