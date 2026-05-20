-- In-order migration companion to V199.
-- Some environments disable Flyway out-of-order migrations, so V199 may never apply.
-- This migration is intentionally idempotent and safe to run even if V199 (or later) already ran.

-- 1) Absent email settings table (per-school)
CREATE TABLE IF NOT EXISTS absent_email_setting (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,

    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    receiver_type VARCHAR(100) NOT NULL DEFAULT 'Student',

    subject_template VARCHAR(255) NOT NULL,
    email_body_template TEXT NOT NULL,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_absent_email_setting_school_id
    ON absent_email_setting (school_id);

CREATE INDEX IF NOT EXISTS idx_absent_email_setting_head_office_id
    ON absent_email_setting (head_office_id);

-- 2) Add category support to email history
ALTER TABLE IF EXISTS email_message
    ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- If email_message doesn't exist yet, create it now with category so V272 becomes a no-op.
CREATE TABLE IF NOT EXISTS email_message (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    class_name VARCHAR(255),
    receiver_type VARCHAR(100) NOT NULL,
    receiver VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    email_body TEXT NOT NULL,
    send_date DATE NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_message_school_id ON email_message (school_id);
CREATE INDEX IF NOT EXISTS idx_email_message_head_office_id ON email_message (head_office_id);
CREATE INDEX IF NOT EXISTS idx_email_message_send_date ON email_message (send_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_email_message_category ON email_message (category);

