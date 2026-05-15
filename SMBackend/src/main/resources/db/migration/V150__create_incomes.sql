CREATE TABLE incomes (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    income_head_id BIGINT NOT NULL,
    income_method VARCHAR(100) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    income_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_incomes_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_incomes_income_head FOREIGN KEY (income_head_id) REFERENCES income_heads(id)
);

CREATE INDEX idx_incomes_school ON incomes(school_id);
CREATE INDEX idx_incomes_income_head ON incomes(income_head_id);
CREATE INDEX idx_incomes_income_date ON incomes(income_date);
