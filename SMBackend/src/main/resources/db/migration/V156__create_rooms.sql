CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    hostel_id BIGINT NOT NULL,
    room_no VARCHAR(255) NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    seat_total INTEGER NOT NULL,
    cost_per_seat NUMERIC(12,2),
    note TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_rooms_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_rooms_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(id)
);

CREATE INDEX IF NOT EXISTS idx_rooms_head_office_id ON rooms(head_office_id);
CREATE INDEX IF NOT EXISTS idx_rooms_school_id ON rooms(school_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hostel_id ON rooms(hostel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON rooms(room_type);
