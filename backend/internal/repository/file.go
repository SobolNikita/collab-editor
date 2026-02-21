package repository

import (
	"database/sql"
	"strconv"
	"time"

	"github.com/SobolNikita/collab-editor/internal/models"
)

func CreateFile(db *sql.DB, file *models.File) error {
	query := `
		INSERT INTO files (owner_id, title, language, content)
		VALUES($1, $2, $3, $4)
		RETURNING id
	`
	var id int64
	err := db.QueryRow(query, file.OwnerID, file.Title, file.Language, file.Content).Scan(&id)
	if err != nil {
		return err
	}
	file.ID = strconv.FormatInt(id, 10)
	now := time.Now()
	file.CreatedAt = now
	file.UpdatedAt = now
	return nil
}

func GetFileByID(db *sql.DB, id string) (*models.File, error) {
	query := `
		SELECT id, owner_id, title, language, content, created_at, updated_at
		FROM files
		WHERE id = $1
	`
	var file models.File
	var id64, ownerID64 int64
	err := db.QueryRow(query, id).Scan(&id64, &ownerID64, &file.Title, &file.Language, &file.Content, &file.CreatedAt, &file.UpdatedAt)
	if err != nil {
		return nil, err
	}
	file.ID = strconv.FormatInt(id64, 10)
	file.OwnerID = strconv.FormatInt(ownerID64, 10)
	return &file, nil
}

func GetByOwnerID(db *sql.DB, ownerID string) ([]*models.File, error) {
	query := `
		SELECT id, owner_id, title, language, content, created_at, updated_at
		FROM files
		WHERE owner_id = $1
	`
	rows, err := db.Query(query, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []*models.File
	for rows.Next() {
		var f models.File
		var id64, ownerID64 int64
		err := rows.Scan(&id64, &ownerID64, &f.Title, &f.Language, &f.Content, &f.CreatedAt, &f.UpdatedAt)
		if err != nil {
			return nil, err
		}
		f.ID = strconv.FormatInt(id64, 10)
		f.OwnerID = strconv.FormatInt(ownerID64, 10)
		files = append(files, &f)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return files, nil
}

func UpdateFile(db *sql.DB, file *models.File) error {
	query := `
		UPDATE files
		SET title = $1, language = $2, content = $3, updated_at = $4
		WHERE id = $5
	`
	now := time.Now()
	_, err := db.Exec(query, file.Title, file.Language, file.Content, now, file.ID)
	if err != nil {
		return err
	}
	file.UpdatedAt = now
	return nil
}

func DeleteFile(db *sql.DB, id string) error {
	query := `
		DELETE FROM files
		WHERE id = $1
	`
	_, err := db.Exec(query, id)
	if err != nil {
		return err
	}
	return nil
}
