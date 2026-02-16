CREATE TABLE IF NOT EXISTS files (
    id         BIGSERIAL PRIMARY KEY,
    owner_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    language   VARCHAR(50) NOT NULL DEFAULT 'plaintext',
    content    TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_owner_id ON files(owner_id);
