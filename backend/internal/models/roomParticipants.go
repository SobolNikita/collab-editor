package models

import "time"

type RoomParticipant struct {
	ID       int64     `json:"id"`
	FileID   int64     `json:"-"`
	UserID   int64     `json:"user_id"`
	Name     string    `json:"name,omitempty"`
	Email    string    `json:"email,omitempty"`
	Color    string    `json:"color,omitempty"`
	JoinedAt time.Time `json:"joined_at,omitempty"`
}
