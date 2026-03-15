package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/SobolNikita/collab-editor/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(userID string, cfg *config.Config) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(30 * 24 * time.Hour).Unix(),
	})
	return token.SignedString([]byte(cfg.JWTSecret))
}

func ValidateToken(tokenString string, cfg *config.Config) (string, error) {
	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}

	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return "", errors.New("missing or invalid sub")
	}
	return sub, nil
}

func UserIDFromRequest(r *http.Request, cfg *config.Config) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return "", errors.New("missing bearer token")
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	return ValidateToken(tokenString, cfg)
}
