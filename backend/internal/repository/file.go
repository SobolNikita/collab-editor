package repository

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math/big"

	"github.com/SobolNikita/collab-editor/internal/models"
	"github.com/jackc/pgx/v5/pgconn"
)

const maxRetries = 5

func CreateFile(ctx context.Context, file *models.File) error {
	for i := 0; i < maxRetries; i++ {
		shortCode, err := GenerateShortCode(6)
		if err != nil {
			return err
		}
		file.ShortCode = shortCode

		err = DB.QueryRowContext(ctx,
			`INSERT INTO files (short_code, owner_id, title) VALUES ($1, $2, $3) RETURNING id`,
			file.ShortCode, file.OwnerID, file.Title,
		).Scan(&file.ID)

		if err == nil {
			return nil
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				log.Printf("The code %s is already exists, generating a new one (attempt %d)", shortCode, i+1)
				continue
			}
		}

		return err

	}

	return errors.New("Error creating file")
}

func participantColor(userID, fileID int64) string {
	h := (userID*31 + fileID) % 360
	if h < 0 {
		h += 360
	}
	return fmt.Sprintf("hsl(%d, 70%%, 60%%)", h)
}

func AddParticipantByFileID(ctx context.Context, fileID, userID int64) error {
	color := participantColor(userID, fileID)
	_, err := DB.ExecContext(ctx,
		`INSERT INTO room_participants (file_id, user_id, color) VALUES ($1, $2, $3) ON CONFLICT (file_id, user_id) DO NOTHING`,
		fileID, userID, color,
	)
	return err
}

func GetFileByID(ctx context.Context, id int64) (*models.File, error) {
	f := &models.File{}
	err := DB.QueryRowContext(ctx,
		`SELECT id, short_code, owner_id, title, language, content, yjs_state, created_at, updated_at FROM files WHERE id = $1`,
		id,
	).Scan(&f.ID, &f.ShortCode, &f.OwnerID, &f.Title, &f.Language, &f.Content, &f.YjsState, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return f, nil
}

func GetFileByShortCode(ctx context.Context, shortCode string) (*models.File, error) {
	f := &models.File{}
	err := DB.QueryRowContext(ctx,
		`SELECT id, short_code, owner_id, title, language, content, yjs_state, created_at, updated_at FROM files WHERE short_code = $1`,
		shortCode,
	).Scan(&f.ID, &f.ShortCode, &f.OwnerID, &f.Title, &f.Language, &f.Content, &f.YjsState, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return f, nil
}

const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

func GenerateShortCode(length int) (string, error) {
	b := make([]byte, length)
	charsetLength := big.NewInt(int64(len(charset)))

	for i := 0; i < length; i++ {
		randomIndex, err := rand.Int(rand.Reader, charsetLength)
		if err != nil {
			return "", err
		}
		b[i] = charset[randomIndex.Int64()]
	}

	return string(b), nil
}

func GetRoomParticipants(ctx context.Context, roomCode string) ([]models.RoomParticipant, error) {
	file, err := GetFileByShortCode(ctx, roomCode)
	if err != nil {
		return nil, err
	}
	fileID := file.ID

	rows, err := DB.QueryContext(ctx,
		`SELECT rp.user_id, rp.joined_at, rp.color, u.name, u.email
		 FROM room_participants rp
		 JOIN users u ON u.id = rp.user_id
		 WHERE rp.file_id = $1`,
		fileID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var participants []models.RoomParticipant

	for rows.Next() {
		var p models.RoomParticipant
		p.FileID = fileID

		if err := rows.Scan(&p.UserID, &p.JoinedAt, &p.Color, &p.Name, &p.Email); err != nil {
			return nil, err
		}
		p.ID = p.UserID

		participants = append(participants, p)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return participants, nil
}

func GetRoomsByParticipantUserID(ctx context.Context, userID int64) ([]models.RoomSummary, error) {
	rows, err := DB.QueryContext(ctx,
		`SELECT f.short_code, f.title, f.owner_id
		 FROM files f
		 INNER JOIN room_participants rp ON rp.file_id = f.id
		 WHERE rp.user_id = $1`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.RoomSummary
	for rows.Next() {
		var r models.RoomSummary
		var ownerID int64
		if err := rows.Scan(&r.ShortCode, &r.Title, &ownerID); err != nil {
			return nil, err
		}
		r.IsOwner = (ownerID == userID)
		list = append(list, r)
	}
	return list, rows.Err()
}

func DeleteFileByShortCode(ctx context.Context, shortCode string) error {
	_, err := DB.ExecContext(ctx, `DELETE FROM files WHERE short_code = $1`, shortCode)
	return err
}

func SaveDoc(ctx context.Context, roomCode string, userID int64, yjsState []byte) error {
	_, err := DB.ExecContext(ctx, `UPDATE files SET yjs_state = $1, updated_at = NOW() WHERE short_code = $2`, yjsState, roomCode)
	return err
}
