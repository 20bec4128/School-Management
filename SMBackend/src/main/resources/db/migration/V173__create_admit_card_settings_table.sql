CREATE TABLE IF NOT EXISTS admit_card_settings (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    border_color VARCHAR(32) NOT NULL,
    top_background VARCHAR(32) NOT NULL,
    card_school_name TEXT,
    school_name_font_size VARCHAR(32),
    school_name_color VARCHAR(32),
    school_address TEXT,
    school_address_color VARCHAR(32),
    admit_title_font_size VARCHAR(32),
    admit_title_color VARCHAR(32),
    admit_title_background VARCHAR(32),
    title_font_size VARCHAR(32),
    title_color VARCHAR(32),
    value_font_size VARCHAR(32),
    value_color VARCHAR(32),
    exam_title_font_size VARCHAR(32),
    exam_title_color VARCHAR(32),
    subject_font_size VARCHAR(32),
    subject_color VARCHAR(32),
    bottom_signature TEXT NOT NULL,
    signature_background VARCHAR(32) NOT NULL,
    signature_color VARCHAR(32),
    signature_align VARCHAR(16),
    card_logo_url TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_admit_card_settings_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id),
    CONSTRAINT fk_admit_card_settings_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_admit_card_settings_head_office_id ON admit_card_settings(head_office_id);
CREATE INDEX IF NOT EXISTS idx_admit_card_settings_school_id ON admit_card_settings(school_id);
CREATE INDEX IF NOT EXISTS idx_admit_card_settings_bottom_signature ON admit_card_settings(bottom_signature);
