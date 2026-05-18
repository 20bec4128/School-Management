CREATE TABLE suggestions (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    exam_term VARCHAR(255) NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    suggestion_text TEXT NOT NULL,
    document_name VARCHAR(255),
    document_type VARCHAR(255),
    document_path VARCHAR(500),
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suggestions_head_office_id ON suggestions(head_office_id);
CREATE INDEX idx_suggestions_school_id ON suggestions(school_id);
CREATE INDEX idx_suggestions_exam_term ON suggestions(exam_term);
