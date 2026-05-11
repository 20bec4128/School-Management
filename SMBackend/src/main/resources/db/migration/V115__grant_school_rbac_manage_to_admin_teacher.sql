-- ============================================================
--  V115 : Allow ADMIN/TEACHER to manage school role permissions
-- ============================================================

INSERT INTO role_permissions(role, permission_code) VALUES
    ('ADMIN', 'SCHOOL_RBAC_MANAGE'),
    ('TEACHER', 'SCHOOL_RBAC_MANAGE')
ON CONFLICT DO NOTHING;

