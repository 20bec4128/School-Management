CREATE TABLE IF NOT EXISTS sliders (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    caption VARCHAR(255),
    image TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_sliders_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_sliders_head_office ON sliders (head_office_id);
CREATE INDEX IF NOT EXISTS idx_sliders_school ON sliders (school_id);
CREATE INDEX IF NOT EXISTS idx_sliders_status ON sliders (status);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id BIGSERIAL PRIMARY KEY,
    plan_name VARCHAR(255) NOT NULL,
    price DOUBLE PRECISION,
    student_limit VARCHAR(100),
    guardian_limit VARCHAR(100),
    teacher_limit VARCHAR(100),
    employee_limit VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_status ON subscription_plans (status);

CREATE TABLE IF NOT EXISTS school_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    plan_id BIGINT,
    plan_name VARCHAR(255) NOT NULL,
    price DOUBLE PRECISION,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_school_subscriptions_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_school_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_school_subscriptions_head_office ON school_subscriptions (head_office_id);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_school ON school_subscriptions (school_id);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_plan ON school_subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_status ON school_subscriptions (status);
