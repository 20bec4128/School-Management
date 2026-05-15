CREATE TABLE expenditures (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    expenditure_head_id BIGINT NOT NULL,
    expenditure_method VARCHAR(100) NOT NULL,
    reference VARCHAR(255),
    amount DOUBLE PRECISION NOT NULL,
    expenditure_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_expenditures_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_expenditures_head FOREIGN KEY (expenditure_head_id) REFERENCES expenditure_heads(id)
);

CREATE INDEX idx_expenditures_school ON expenditures(school_id);
CREATE INDEX idx_expenditures_head ON expenditures(expenditure_head_id);
CREATE INDEX idx_expenditures_date ON expenditures(expenditure_date);
