INSERT INTO permissions(code, description) VALUES
    ('DONOR', 'Manage donors')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('ADMIN', 'DONOR'),
    ('SCHOOL_ADMIN', 'DONOR'),
    ('TEACHER', 'DONOR')
ON CONFLICT DO NOTHING;
