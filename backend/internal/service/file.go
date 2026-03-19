package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/SobolNikita/collab-editor/internal/models"
	"github.com/SobolNikita/collab-editor/internal/repository"
)

var (
	ErrFileNotFound = errors.New("file not found")
	ErrForbidden    = errors.New("forbidden")
)

func CreateFile(ctx context.Context, ownerID int64, title string) (*models.File, error) {
	if title == "" {
		title = "Untitled"
	}
	file := &models.File{
		OwnerID:   ownerID,
		Title:     title,
		ShortCode: "000000",
		Language:  "plaintext",
		Content:   "",
		YjsState:  []byte(""),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := repository.CreateFile(ctx, file); err != nil {
		return nil, err
	}
	if err := repository.AddParticipantByFileID(ctx, file.ID, ownerID); err != nil {
		return nil, err
	}
	return file, nil
}

func AddParticipantByFileID(ctx context.Context, fileID, userID int64) error {
	return repository.AddParticipantByFileID(ctx, fileID, userID)
}

func JoinRoom(ctx context.Context, fileID, userID int64) error {
	_, err := repository.GetFileByID(ctx, fileID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrFileNotFound
		}
		return err
	}
	return repository.AddParticipantByFileID(ctx, fileID, userID)
}

func JoinByCode(ctx context.Context, code string, userID int64) (fileID int64, err error) {
	file, err := repository.GetFileByShortCode(ctx, code)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrFileNotFound
		}
		return 0, err
	}
	if err := repository.AddParticipantByFileID(ctx, file.ID, userID); err != nil {
		return 0, err
	}
	return file.ID, nil
}

func GetFileByID(ctx context.Context, id int64) (*models.File, error) {
	file, err := repository.GetFileByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrFileNotFound
		}
		return nil, err
	}
	return file, nil
}

func GetRoomParticipants(ctx context.Context, roomCode string) ([]models.RoomParticipant, error) {
	list, err := repository.GetRoomParticipants(ctx, roomCode)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrFileNotFound
		}
		return nil, err
	}
	return list, nil
}

func GetOwnerByRoomCode(ctx context.Context, roomCode string) (int64, error) {
	file, err := repository.GetFileByShortCode(ctx, roomCode)
	if err != nil {
		return 0, err
	}
	return file.OwnerID, nil
}

func GetMyRooms(ctx context.Context, userID int64) ([]models.RoomSummary, error) {
	return repository.GetRoomsByParticipantUserID(ctx, userID)
}

func DeleteRoom(ctx context.Context, roomCode string, userID int64) error {
	file, err := repository.GetFileByShortCode(ctx, roomCode)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrFileNotFound
		}
		return err
	}
	if file.OwnerID != userID {
		return ErrForbidden
	}
	return repository.DeleteFileByShortCode(ctx, roomCode)
}

func SaveDoc(ctx context.Context, roomCode string, userID int64, yjsState []byte) error {
	file, err := repository.GetFileByShortCode(ctx, roomCode)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrFileNotFound
		}
		return err
	}
	if file.OwnerID != userID {
		return ErrForbidden
	}
	return repository.SaveDoc(ctx, roomCode, userID, yjsState)
}

func GetDoc(ctx context.Context, roomCode string, userID int64) ([]byte, error) {
	file, err := repository.GetFileByShortCode(ctx, roomCode)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrFileNotFound
		}
		return nil, err
	}
	return file.YjsState, nil
}
