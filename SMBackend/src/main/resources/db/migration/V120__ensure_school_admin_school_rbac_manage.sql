-- ============================================================
--  V120 : Ensure SCHOOL_ADMIN always has SCHOOL_RBAC_MANAGE
--         (Prevents lockout when per-school overrides exist)
-- ============================================================

-- Global role baseline
INSERT INTO role_permissions(role, permission_code) VALUES
    ('SCHOOL_ADMIN', 'SCHOOL_RBAC_MANAGE')
ON CONFLICT DO NOTHING;

-- If a per-school override exists for SCHOOL_ADMIN, ensure it also includes SCHOOL_RBAC_MANAGE.
INSERT INTO school_role_permissions(school_id, role, permission_code)
SELECT DISTINCT srp.school_id, 'SCHOOL_ADMIN', 'SCHOOL_RBAC_MANAGE'
FROM school_role_permissions srp
WHERE upper(srp.role) = 'SCHOOL_ADMIN'
ON CONFLICT DO NOTHING;

