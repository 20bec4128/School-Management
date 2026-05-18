INSERT INTO permissions(code, description) VALUES
    ('GUARDIAN', 'Manage guardians')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('ADMIN', 'GUARDIAN'),
    ('SCHOOL_ADMIN', 'GUARDIAN'),
    ('TEACHER', 'GUARDIAN')
ON CONFLICT DO NOTHING;
