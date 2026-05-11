-- ============================================================
--  V107 : RBAC custom roles + ADMIN permissions in DB
-- ============================================================

-- Canonical roles table
CREATE TABLE IF NOT EXISTS roles (
    name        VARCHAR(50) PRIMARY KEY,
    description VARCHAR(500),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles(name, description) VALUES
    ('SUPER_ADMIN', 'System super administrator'),
    ('ADMIN', 'School administrator'),
    ('TEACHER', 'Teacher'),
    ('STUDENT', 'Student'),
    ('PARENT', 'Parent')
ON CONFLICT (name) DO NOTHING;

-- Add RBAC management permission (UI)
INSERT INTO permissions(code, description) VALUES
    ('RBAC_MANAGE', 'Manage roles and permissions')
ON CONFLICT (code) DO NOTHING;

-- Allow admin_users to use custom roles (school-scoped).
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS chk_admin_users_role;
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS chk_admin_users_school_scope;

ALTER TABLE admin_users
    ADD CONSTRAINT chk_admin_users_school_scope CHECK (
        (school_id IS NULL AND role = 'SUPER_ADMIN') OR
        (school_id IS NOT NULL)
    );

-- Ensure ADMIN has all permissions in DB (so ADMIN can be enforced via role_permissions).
INSERT INTO role_permissions(role, permission_code)
SELECT 'ADMIN', p.code
FROM permissions p
ON CONFLICT DO NOTHING;

