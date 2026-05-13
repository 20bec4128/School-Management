CREATE TABLE IF NOT EXISTS academic_years (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    session_start DATE NOT NULL,
    session_end DATE NOT NULL,
    is_running BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT,

    CONSTRAINT fk_academic_years_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT uk_academic_years_school_year UNIQUE (school_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_academic_years_school_id ON academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_school_running ON academic_years(school_id, is_running);
