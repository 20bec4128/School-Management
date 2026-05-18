-- ============================================================
--  V114 : Remove HEAD_OFFICE_ADMIN role; use head-office scoped ADMIN
-- ============================================================

-- Drop prior scope constraints first so role transitions don't violate them mid-migration.
ALTER TABLE admin_users
    DROP CONSTRAINT IF EXISTS chk_admin_users_role;

ALTER TABLE admin_users
    DROP CONSTRAINT IF EXISTS chk_admin_users_school_scope;

ALTER TABLE admin_users
    DROP CONSTRAINT IF EXISTS chk_admin_users_scope;

-- Defensive: if any legacy rows still have role=ADMIN with school_id, treat them as SCHOOL_ADMIN.
UPDATE admin_users au
SET role = 'SCHOOL_ADMIN',
    head_office_id = COALESCE(au.head_office_id, s.head_office_id)
FROM schools s
WHERE au.school_id IS NOT NULL
  AND s.id = au.school_id
  AND upper(au.role) = 'ADMIN';

-- Convert any existing head-office admins to ADMIN (head-office scoped).
UPDATE admin_users
SET role = 'ADMIN'
WHERE upper(role) = 'HEAD_OFFICE_ADMIN';

-- No global ADMINs anymore: promote any global ADMIN to SUPER_ADMIN.
UPDATE admin_users
SET role = 'SUPER_ADMIN'
WHERE upper(role) = 'ADMIN'
  AND head_office_id IS NULL
  AND school_id IS NULL;

-- Ensure any SCHOOL_ADMIN rows have head_office_id populated.
UPDATE admin_users au
SET head_office_id = s.head_office_id
FROM schools s
WHERE au.school_id IS NOT NULL
  AND s.id = au.school_id
  AND upper(au.role) = 'SCHOOL_ADMIN'
  AND au.head_office_id IS NULL;

-- Replace admin_users scope constraints to enforce:
--  SUPER_ADMIN: head_office_id IS NULL AND school_id IS NULL
--  ADMIN      : head_office_id IS NOT NULL AND school_id IS NULL
--  SCHOOL_ADMIN: head_office_id IS NOT NULL AND school_id IS NOT NULL
ALTER TABLE admin_users
    ADD CONSTRAINT chk_admin_users_role
        CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'));

ALTER TABLE admin_users
    ADD CONSTRAINT chk_admin_users_scope
        CHECK (
            (role = 'SUPER_ADMIN' AND head_office_id IS NULL AND school_id IS NULL) OR
            (role = 'ADMIN' AND head_office_id IS NOT NULL AND school_id IS NULL) OR
            (role = 'SCHOOL_ADMIN' AND head_office_id IS NOT NULL AND school_id IS NOT NULL)
        );

-- Remove HEAD_OFFICE_ADMIN from RBAC seed tables (if present).
DELETE FROM role_permissions WHERE upper(role) = 'HEAD_OFFICE_ADMIN';
DELETE FROM roles WHERE upper(name) = 'HEAD_OFFICE_ADMIN';
