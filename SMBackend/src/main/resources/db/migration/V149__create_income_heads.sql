CREATE TABLE income_heads (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    income_head VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_income_heads_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX idx_income_heads_school ON income_heads(school_id);
CREATE INDEX idx_income_heads_income_head ON income_heads(income_head);
