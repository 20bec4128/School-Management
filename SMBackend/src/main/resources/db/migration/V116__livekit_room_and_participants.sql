-- LiveKit integration: store room name + actual start/end, and track meeting participants

ALTER TABLE live_classes
    ADD COLUMN IF NOT EXISTS room_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_live_classes_room_name ON live_classes(room_name);

CREATE TABLE IF NOT EXISTS meeting_participants (
    id BIGSERIAL PRIMARY KEY,
    live_class_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    join_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leave_time TIMESTAMP,
    duration_seconds BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_meeting_participants_live_class FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_live_class_user ON meeting_participants(live_class_id, user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_live_class_join ON meeting_participants(live_class_id, join_time);

-- Ensure parents can join live classes too (view-only by default)
INSERT INTO role_permissions(role, permission_code) VALUES
    ('PARENT', 'LIVE_CLASS_JOIN')
ON CONFLICT DO NOTHING;

