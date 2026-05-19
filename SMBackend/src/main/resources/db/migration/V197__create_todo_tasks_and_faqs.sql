CREATE TABLE IF NOT EXISTS todo_tasks (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    user_type VARCHAR(80) NOT NULL,
    assign_to_id BIGINT,
    assign_to_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    todo_date DATE,
    work_status VARCHAR(60) NOT NULL,
    description TEXT,
    comment TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_todo_tasks_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_todo_tasks_head_office ON todo_tasks (head_office_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_school ON todo_tasks (school_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_user_type ON todo_tasks (user_type);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_status ON todo_tasks (work_status);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_date ON todo_tasks (todo_date);

CREATE TABLE IF NOT EXISTS faqs (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_faqs_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_faqs_head_office ON faqs (head_office_id);
CREATE INDEX IF NOT EXISTS idx_faqs_school ON faqs (school_id);
CREATE INDEX IF NOT EXISTS idx_faqs_title ON faqs (title);
