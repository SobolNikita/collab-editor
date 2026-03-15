package oauth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/SobolNikita/collab-editor/internal/config"
	"github.com/SobolNikita/collab-editor/internal/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

func GetGoogleConfig(cfg *config.Config) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURL,
		Scopes:       []string{"email", "profile"},
		Endpoint:     google.Endpoint,
	}
}

type googleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func GetGoogleUser(ctx context.Context, code string, cfg *config.Config) (*models.User, error) {
	oauthCfg := GetGoogleConfig(cfg)
	token, err := oauthCfg.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("google userinfo: " + fmt.Sprint(resp.StatusCode))
	}

	var info googleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}

	user := &models.User{
		GoogleID: info.ID,
		Email:    info.Email,
		Name:     info.Name,
		Avatar:   info.Picture,
	}
	return user, nil
}
