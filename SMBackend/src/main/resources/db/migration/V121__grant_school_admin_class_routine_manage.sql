INSERT INTO role_permissions(role, permission_code) VALUES
    ('SCHOOL_ADMIN', 'CLASS_ROUTINE_MANAGE')
ON CONFLICT DO NOTHING;

INSERT INTO school_role_permissions(school_id, role, permission_code)
SELECT DISTINCT school_id, 'SCHOOL_ADMIN', 'CLASS_ROUTINE_MANAGE'
FROM school_role_permissions
WHERE UPPER(role) = 'SCHOOL_ADMIN'
ON CONFLICT DO NOTHING;
