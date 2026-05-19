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
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_message_school_id ON email_message (school_id);
CREATE INDEX IF NOT EXISTS idx_email_message_head_office_id ON email_message (head_office_id);
CREATE INDEX IF NOT EXISTS idx_email_message_send_date ON email_message (send_date DESC, id DESC);
