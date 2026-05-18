CREATE TABLE IF NOT EXISTS guardians (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    profession VARCHAR(120) NOT NULL,
    religion VARCHAR(120),
    present_address TEXT,
    permanent_address TEXT,
    national_id VARCHAR(80),
    email VARCHAR(200),
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    other_info TEXT,
    photo_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_guardians_school_id ON guardians (school_id);
CREATE INDEX IF NOT EXISTS idx_guardians_profession ON guardians (profession);
