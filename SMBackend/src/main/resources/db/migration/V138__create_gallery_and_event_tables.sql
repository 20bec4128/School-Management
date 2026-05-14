CREATE TABLE IF NOT EXISTS galleries (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    note TEXT NULL,
    is_view_on_web BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_galleries_school_id ON galleries (school_id);
CREATE INDEX idx_galleries_school_deleted ON galleries (school_id, is_deleted);

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    event_for VARCHAR(100) NOT NULL,
    event_place VARCHAR(255) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    image_url TEXT NULL,
    note TEXT NULL,
    is_view_on_web BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_school_id ON events (school_id);
CREATE INDEX idx_events_school_deleted ON events (school_id, is_deleted);
