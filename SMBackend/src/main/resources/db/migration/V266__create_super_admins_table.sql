CREATE TABLE IF NOT EXISTS super_admins (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    national_id VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    gender VARCHAR(30) NOT NULL,
    blood_group VARCHAR(30),
    religion VARCHAR(50),
    birth_date DATE NOT NULL,
    present_address TEXT,
    permanent_address TEXT,
    email VARCHAR(255),
    username VARCHAR(120) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    resume_url TEXT,
    other_info TEXT,
    photo_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins (username);
