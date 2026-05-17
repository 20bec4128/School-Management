CREATE TABLE IF NOT EXISTS ebooks (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    class_id BIGINT,
    subject_id BIGINT,
    ebook_name VARCHAR(255) NOT NULL,
    edition VARCHAR(255),
    author VARCHAR(255),
    language VARCHAR(255),
    cover_image TEXT,
    file_name VARCHAR(255),
    file_path TEXT,
    ebook_type VARCHAR(32) NOT NULL DEFAULT 'SUBJECT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ebooks_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id),
    CONSTRAINT fk_ebooks_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_ebooks_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_ebooks_subject FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE INDEX IF NOT EXISTS idx_ebooks_head_office_id ON ebooks(head_office_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_school_id ON ebooks(school_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_class_id ON ebooks(class_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_ebook_name ON ebooks(ebook_name);
