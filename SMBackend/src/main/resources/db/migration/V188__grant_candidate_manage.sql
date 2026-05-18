INSERT INTO permissions(code, description) VALUES
    ('CANDIDATE', 'Manage candidates')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('ADMIN', 'CANDIDATE'),
    ('SCHOOL_ADMIN', 'CANDIDATE'),
    ('TEACHER', 'CANDIDATE')
ON CONFLICT DO NOTHING;
