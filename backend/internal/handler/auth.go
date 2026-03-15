package handler

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"

	"github.com/SobolNikita/collab-editor/internal/auth"
	"github.com/SobolNikita/collab-editor/internal/config"
	"github.com/SobolNikita/collab-editor/internal/models"
	"github.com/SobolNikita/collab-editor/internal/oauth"
	"github.com/SobolNikita/collab-editor/internal/service"
)

type googleState struct {
	CallbackURL string `json:"callback_url"`
	Redirect    string `json:"redirect"`
}

func GoogleAuth(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	callbackURL := r.URL.Query().Get("callback_url")
	redirect := r.URL.Query().Get("redirect")
	if callbackURL == "" {
		http.Error(w, "missing callback_url", http.StatusBadRequest)
		return
	}

	state := googleState{CallbackURL: callbackURL, Redirect: redirect}
	stateJSON, _ := json.Marshal(state)
	stateEnc := base64.URLEncoding.EncodeToString(stateJSON)

	googleCfg := oauth.GetGoogleConfig(&cfg)
	authURL := googleCfg.AuthCodeURL(stateEnc)
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

func GoogleCallback(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	code := r.URL.Query().Get("code")
	stateEnc := r.URL.Query().Get("state")
	if code == "" || stateEnc == "" {
		http.Error(w, "missing code or state", http.StatusBadRequest)
		return
	}

	var state googleState
	stateJSON, err := base64.URLEncoding.DecodeString(stateEnc)
	if err != nil {
		http.Error(w, "invalid state", http.StatusBadRequest)
		return
	}
	if err := json.Unmarshal(stateJSON, &state); err != nil {
		http.Error(w, "invalid state", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	googleUser, err := oauth.GetGoogleUser(ctx, code, &cfg)
	if err != nil {
		http.Error(w, "google auth failed: "+err.Error(), http.StatusUnauthorized)
		return
	}

	user, err := findOrCreateUserByGoogle(ctx, googleUser)
	if err != nil {
		http.Error(w, "user lookup failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	token, err := auth.GenerateToken(formatUserID(user.ID), &cfg)
	if err != nil {
		http.Error(w, "token failed", http.StatusInternalServerError)
		return
	}

	userPayload := map[string]interface{}{
		"id":    user.ID,
		"email": user.Email,
		"name":  user.Name,
	}
	userJSON, _ := json.Marshal(userPayload)
	vals := url.Values{}
	vals.Set("token", token)
	vals.Set("user", string(userJSON))
	vals.Set("redirect", state.Redirect)
	redirectURL := state.CallbackURL + "?" + vals.Encode()
	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

var DB *sql.DB

func SetDB(db *sql.DB) {
	DB = db
}

func formatUserID(id int64) string {
	return strconv.FormatInt(id, 10)
}

func findOrCreateUserByGoogle(ctx context.Context, u *models.User) (*models.User, error) {
	if DB == nil {
		return nil, sql.ErrNoRows
	}
	var id int64
	var email, name, googleID, avatar string
	err := DB.QueryRowContext(ctx,
		`SELECT id, email, name, google_id, avatar FROM users WHERE google_id = $1`,
		u.GoogleID,
	).Scan(&id, &email, &name, &googleID, &avatar)
	if err == nil {
		return &models.User{ID: id, Email: email, Name: name, GoogleID: googleID, Avatar: avatar}, nil
	}
	if err != sql.ErrNoRows {
		return nil, err
	}

	err = DB.QueryRowContext(ctx,
		`INSERT INTO users (email, name, google_id, avatar, password_hash) VALUES ($1, $2, $3, $4, '') RETURNING id`,
		u.Email, u.Name, u.GoogleID, u.Avatar,
	).Scan(&id)
	if err != nil {
		return nil, err
	}
	u.ID = id
	return u, nil
}

func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	cfg, err := config.Load()
	if err != nil {
		respondJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondJSONError(w, "invalid body", http.StatusBadRequest)
		return
	}
	user, token, err := service.Login(r.Context(), body.Email, body.Password, &cfg)
	if err != nil {
		respondJSONError(w, err.Error(), http.StatusUnauthorized)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"token": token, "user": user})
}

func Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	cfg, err := config.Load()
	if err != nil {
		respondJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondJSONError(w, "invalid body", http.StatusBadRequest)
		return
	}
	user, token, err := service.Register(r.Context(), body.Email, body.Password, body.Name, &cfg)
	if err != nil {
		respondJSONError(w, "The user with this email is already registered", http.StatusBadRequest)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"token": token, "user": user})
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondJSONError(w http.ResponseWriter, message string, status int) {
	respondJSON(w, status, map[string]string{"error": message})
}
