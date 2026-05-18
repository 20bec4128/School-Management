CREATE TABLE IF NOT EXISTS opening_hours (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    status BOOLEAN DEFAULT TRUE NOT NULL,
    
    monday_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    monday_start VARCHAR(10),
    monday_end VARCHAR(10),
    
    tuesday_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    tuesday_start VARCHAR(10),
    tuesday_end VARCHAR(10),
    
    wednesday_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    wednesday_start VARCHAR(10),
    wednesday_end VARCHAR(10),
    
    thursday_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    thursday_start VARCHAR(10),
    thursday_end VARCHAR(10),
    
    friday_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    friday_start VARCHAR(10),
    friday_end VARCHAR(10),
    
    saturday_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    saturday_start VARCHAR(10),
    saturday_end VARCHAR(10),
    
    sunday_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    sunday_start VARCHAR(10),
    sunday_end VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_opening_hours_school_id ON opening_hours (school_id);
