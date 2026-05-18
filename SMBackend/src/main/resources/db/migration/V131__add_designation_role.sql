ALTER TABLE designations
    ADD COLUMN IF NOT EXISTS role VARCHAR(50);

UPDATE designations
SET role = COALESCE(role, 'TEACHER')
WHERE role IS NULL OR TRIM(role) = '';

ALTER TABLE designations
    ALTER COLUMN role SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_designations_school_role ON designations (school_id, role);
DROP INDEX IF EXISTS ux_designations_school_id_name;
CREATE UNIQUE INDEX IF NOT EXISTS ux_designations_school_role_name
    ON designations (school_id, role, lower(name));
