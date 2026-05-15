CREATE TABLE issues (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    user_type VARCHAR(100) NOT NULL,
    issue_to_id BIGINT NOT NULL,
    issue_to_name VARCHAR(255) NOT NULL,
    category_id BIGINT NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(18,2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_issues_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id),
    CONSTRAINT fk_issues_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_issues_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_issues_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_issues_head_office_id ON issues(head_office_id);
CREATE INDEX idx_issues_school_id ON issues(school_id);
CREATE INDEX idx_issues_category_id ON issues(category_id);
CREATE INDEX idx_issues_product_id ON issues(product_id);
CREATE INDEX idx_issues_user_type ON issues(user_type);
