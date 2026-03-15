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