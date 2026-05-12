-- ============================================================
--  V106 : additional RBAC permissions
-- ============================================================

INSERT INTO permissions(code, description) VALUES
    ('CHILD_PROFILE_VIEW', 'Parent view child profile')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('PARENT', 'CHILD_PROFILE_VIEW')
ON CONFLICT DO NOTHING;

