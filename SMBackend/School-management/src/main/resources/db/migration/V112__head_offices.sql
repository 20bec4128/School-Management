-- ============================================================
--  V112 : Head offices (group layer) + admin scoping
-- ============================================================

CREATE TABLE IF NOT EXISTS head_offices (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    status      VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_head_offices_status ON head_offices(status);

ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS head_office_id BIGINT;

ALTER TABLE schools
    ADD CONSTRAINT fk_schools_head_office
        FOREIGN KEY (head_office_id) REFERENCES head_offices(id)
        ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_schools_head_office_id ON schools(head_office_id);

ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS head_office_id BIGINT;

-- ------------------------------------------------------------
-- Backfill existing single-platform data into a default head office
-- so the new scope constraint can be applied safely.
-- ------------------------------------------------------------
INSERT INTO head_offices(name, status)
VALUES ('DEFAULT_HEAD_OFFICE', 'ACTIVE')
ON CONFLICT (name) DO NOTHING;

-- Assign any existing schools to the default head office.
UPDATE schools
SET head_office_id = (SELECT id FROM head_offices WHERE name = 'DEFAULT_HEAD_OFFICE')
WHERE head_office_id IS NULL;

-- Legacy: older schema used role='ADMIN' with school_id NOT NULL for SCHOOL_ADMIN users.
-- Convert them to role='SCHOOL_ADMIN' and attach head_office_id from their school.
UPDATE admin_users au
SET role = 'SCHOOL_ADMIN',
    head_office_id = s.head_office_id
FROM schools s
WHERE au.school_id IS NOT NULL
  AND s.id = au.school_id
  AND upper(au.role) = 'ADMIN';

-- Ensure any SCHOOL_ADMIN rows have head_office_id populated.
UPDATE admin_users au
SET head_office_id = s.head_office_id
FROM schools s
WHERE au.school_id IS NOT NULL
  AND s.id = au.school_id
  AND upper(au.role) = 'SCHOOL_ADMIN'
  AND au.head_office_id IS NULL;

-- Ensure global admins have no school/head office linkage.
UPDATE admin_users
SET school_id = NULL,
    head_office_id = NULL
WHERE upper(role) IN ('SUPER_ADMIN','ADMIN')
  AND (school_id IS NOT NULL OR head_office_id IS NOT NULL);

ALTER TABLE admin_users
    DROP CONSTRAINT IF EXISTS chk_admin_users_role;

ALTER TABLE admin_users
    DROP CONSTRAINT IF EXISTS chk_admin_users_school_scope;

ALTER TABLE admin_users
    ADD CONSTRAINT fk_admin_users_head_office
        FOREIGN KEY (head_office_id) REFERENCES head_offices(id)
        ON DELETE SET NULL;

ALTER TABLE admin_users
    ADD CONSTRAINT chk_admin_users_role
        CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'HEAD_OFFICE_ADMIN', 'SCHOOL_ADMIN'));

-- Backward compatible with existing roles:
--  SUPER_ADMIN / ADMIN : global (no head office, no school)
--  HEAD_OFFICE_ADMIN   : head office scoped (has head_office_id, no school_id)
--  SCHOOL_ADMIN        : school scoped (has head_office_id + school_id)
ALTER TABLE admin_users
    ADD CONSTRAINT chk_admin_users_scope
        CHECK (
            (role IN ('SUPER_ADMIN','ADMIN') AND head_office_id IS NULL AND school_id IS NULL) OR
            (role = 'HEAD_OFFICE_ADMIN' AND head_office_id IS NOT NULL AND school_id IS NULL) OR
            (role = 'SCHOOL_ADMIN' AND head_office_id IS NOT NULL AND school_id IS NOT NULL)
        );

CREATE INDEX IF NOT EXISTS idx_admin_users_head_office_id ON admin_users(head_office_id);

INSERT INTO permissions(code, description) VALUES
    ('HEAD_OFFICE_MANAGE', 'Manage head offices'),
    ('HEAD_OFFICE_SCHOOL_MANAGE', 'Manage schools under own head office')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('SUPER_ADMIN', 'HEAD_OFFICE_MANAGE'),
    ('HEAD_OFFICE_ADMIN', 'HEAD_OFFICE_SCHOOL_MANAGE'),
    ('HEAD_OFFICE_ADMIN', 'SCHOOL_MANAGE')
ON CONFLICT DO NOTHING;
