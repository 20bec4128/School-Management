INSERT INTO permissions(code, description) VALUES
    ('SCHOLARSHIP', 'Manage scholarships')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('ADMIN', 'SCHOLARSHIP'),
    ('SCHOOL_ADMIN', 'SCHOLARSHIP'),
    ('TEACHER', 'SCHOLARSHIP')
ON CONFLICT DO NOTHING;
