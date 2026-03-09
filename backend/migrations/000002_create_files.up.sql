CREATE TABLE IF NOT EXISTS files (
    id         BIGSERIAL PRIMARY KEY,
    slug        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    short_code VARCHAR(6) UNIQUE NOT NULL,
    owner_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    language   VARCHAR(50) NOT NULL DEFAULT 'plaintext',
    content    TEXT NOT NULL DEFAULT '',
    yjs_state  BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_files_short_code ON files(short_code);