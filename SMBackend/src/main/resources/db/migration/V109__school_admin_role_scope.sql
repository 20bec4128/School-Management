INSERT INTO roles(name, description) VALUES
    ('SCHOOL_ADMIN', 'Single-school administrator')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS chk_admin_users_school_scope;

ALTER TABLE admin_users
    ADD CONSTRAINT chk_admin_users_school_scope CHECK (
        (role IN ('SUPER_ADMIN', 'ADMIN') AND school_id IS NULL) OR
        (role = 'SCHOOL_ADMIN' AND school_id IS NOT NULL) OR
        (role NOT IN ('SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN') AND school_id IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS idx_admin_users_role_school ON admin_users(role, school_id);
