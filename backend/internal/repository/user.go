package repository

import (
	"database/sql"
	"strconv"
	"time"

	"github.com/SobolNikita/collab-editor/internal/models"
)

func CreateUser(db *sql.DB, user *models.User) error {
	query := `
		INSERT INTO users (email, password_hash, google_id, name, avatar)
		VALUES($1, $2, $3, $4, $5)
		RETURNING id
		`
	var id int64

	err := db.QueryRow(query, user.Email, user.PasswordHash, user.GoogleID, user.Name, user.Avatar).Scan(&id)

	if err != nil {
		return err
	}
	user.ID = strconv.FormatInt(id, 10)
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	return nil
}

func GetUserByID(db *sql.DB, id string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, google_id, name, avatar, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	var user models.User
	var id64 int64
	var passwordHash, googleID, avatar sql.NullString
	err := db.QueryRow(query, id).Scan(&id64, &user.Email, &passwordHash, &googleID, &user.Name, &avatar, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	user.ID = strconv.FormatInt(id64, 10)
	user.PasswordHash = nullString(passwordHash)
	user.GoogleID = nullString(googleID)
	user.Avatar = nullString(avatar)
	return &user, nil
}

func GetUserByEmail(db *sql.DB, email string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, google_id, name, avatar, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	var user models.User
	var id64 int64
	var passwordHash, googleID, avatar sql.NullString
	err := db.QueryRow(query, email).Scan(&id64, &user.Email, &passwordHash, &googleID, &user.Name, &avatar, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	user.ID = strconv.FormatInt(id64, 10)
	user.PasswordHash = nullString(passwordHash)
	user.GoogleID = nullString(googleID)
	user.Avatar = nullString(avatar)
	return &user, nil
}

func GetUserByGoogleID(db *sql.DB, googleID string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, google_id, name, avatar, created_at, updated_at
		FROM users
		WHERE google_id = $1
	`
	var user models.User
	var id64 int64
	var passwordHash, gid, avatar sql.NullString
	err := db.QueryRow(query, googleID).Scan(&id64, &user.Email, &passwordHash, &gid, &user.Name, &avatar, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	user.ID = strconv.FormatInt(id64, 10)
	user.PasswordHash = nullString(passwordHash)
	user.GoogleID = nullString(gid)
	user.Avatar = nullString(avatar)
	return &user, nil
}

func UpdateUser(db *sql.DB, user *models.User) error {
	query := `
		UPDATE users
		SET email = $1, password_hash = $2, google_id = $3, name = $4, avatar = $5
		WHERE id = $6
	`
	_, err := db.Exec(query, user.Email, user.PasswordHash, user.GoogleID, user.Name, user.Avatar, user.ID)
	if err != nil {
		return err
	}
	user.UpdatedAt = time.Now()
	return nil
}

func DeleteUser(db *sql.DB, id string) error {
	query := `
		DELETE FROM users
		WHERE id = $1
	`
	_, err := db.Exec(query, id)
	if err != nil {
		return err
	}
	return nil
}
