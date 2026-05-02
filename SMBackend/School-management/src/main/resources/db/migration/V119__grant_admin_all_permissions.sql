-- ============================================================
--  V119 : Ensure ADMIN can manage within their scope
--         (Grant any newly-added permissions to ADMIN)
-- ============================================================

INSERT INTO role_permissions(role, permission_code)
SELECT 'ADMIN', p.code
FROM permissions p
ON CONFLICT DO NOTHING;

