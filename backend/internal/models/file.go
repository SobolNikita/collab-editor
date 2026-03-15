// Package models — структуры данных (продолжение).
//
// file.go — ожидаемые типы:
//
//   - type File struct { ID int64, ShortCode string, OwnerID int64, Title string, ... } — поля совпадают с таблицей files.
//     ShortCode — это roomCode (например H45G2K), по нему строятся комнаты и room_participants.
//
// - type RoomParticipant struct { ... } — при наличии отдельной таблицы room_participants.
package models

import "time"

type File struct {
	ID        int64
	slug      string
	ShortCode string
	OwnerID   int64
	Title     string
	Language  string
	Content   string
	YjsState  []byte
	CreatedAt time.Time
	UpdatedAt time.Time
}

type RoomSummary struct {
	ShortCode string `json:"shortCode"`
	Title     string `json:"title"`
	IsOwner   bool   `json:"isOwner"`
}