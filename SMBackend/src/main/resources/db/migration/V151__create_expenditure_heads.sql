CREATE TABLE expenditure_heads (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    expenditure_head VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_expenditure_heads_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX idx_expenditure_heads_school ON expenditure_heads(school_id);
CREATE INDEX idx_expenditure_heads_expenditure_head ON expenditure_heads(expenditure_head);
