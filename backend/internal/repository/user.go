package repository

import (
	"context"
	"database/sql"

	"github.com/SobolNikita/collab-editor/internal/models"
)

var DB *sql.DB

func SetDB(db *sql.DB) {
	DB = db
}

func Create(ctx context.Context, user *models.User) error {
	return DB.QueryRowContext(ctx,
		`INSERT INTO users (email, name, password_hash, google_id, avatar) VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, '')) RETURNING id`,
		user.Email, user.Name, user.PasswordHash, user.GoogleID, user.Avatar,
	).Scan(&user.ID)
}

func GetByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}
	var googleID, avatar sql.NullString
	err := DB.QueryRowContext(ctx,
		"SELECT id, email, name, password_hash, google_id, avatar, created_at, updated_at FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Email, &user.Name, &user.PasswordHash, &googleID, &avatar, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if googleID.Valid {
		user.GoogleID = googleID.String
	}
	if avatar.Valid {
		user.Avatar = avatar.String
	}
	return user, nil
}

func GetFilesByOwnerID(ctx context.Context, ownerID int64) ([]models.File, error) {
	rows, err := DB.QueryContext(ctx,
		`SELECT id, short_code, owner_id, title, language, content, created_at, updated_at FROM files WHERE owner_id = $1`,
		ownerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []models.File
	for rows.Next() {
		var f models.File
		if err := rows.Scan(&f.ID, &f.ShortCode, &f.OwnerID, &f.Title, &f.Language, &f.Content, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	return files, rows.Err()
}
