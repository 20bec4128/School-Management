CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    designation_id BIGINT,
    role VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    national_id VARCHAR(100),
    phone VARCHAR(50),
    gender VARCHAR(30),
    blood_group VARCHAR(30),
    religion VARCHAR(50),
    birth_date DATE,
    present_address TEXT,
    permanent_address TEXT,
    email VARCHAR(255),
    username VARCHAR(120),
    password_hash TEXT,
    salary_grade VARCHAR(60),
    salary_type VARCHAR(60),
    joining_date DATE,
    is_view_on_web VARCHAR(10),
    facebook_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    instagram_url TEXT,
    youtube_url TEXT,
    pinterest_url TEXT,
    other_info TEXT,
    photo_url TEXT,
    resume_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_employees_school_id ON employees (school_id);
CREATE INDEX IF NOT EXISTS idx_employees_designation_id ON employees (designation_id);
