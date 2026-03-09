CREATE TABLE IF NOT EXISTS room_participants (
    file_id    BIGINT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (file_id, user_id)
);

CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);
