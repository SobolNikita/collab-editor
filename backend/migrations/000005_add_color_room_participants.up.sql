ALTER TABLE room_participants
  ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT '#94a3b8';

UPDATE room_participants
SET color = 'hsl(' || (ABS(user_id * 31 + file_id) % 360)::text || ', 70%, 60%)'
WHERE color = '#94a3b8';
