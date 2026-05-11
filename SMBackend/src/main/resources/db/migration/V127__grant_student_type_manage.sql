INSERT INTO permissions(code, description) VALUES
    ('STUDENT_TYPE_MANAGE', 'Manage student types')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('ADMIN', 'STUDENT_TYPE_MANAGE'),
    ('SCHOOL_ADMIN', 'STUDENT_TYPE_MANAGE'),
    ('TEACHER', 'STUDENT_TYPE_MANAGE')
ON CONFLICT DO NOTHING;
