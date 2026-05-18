INSERT INTO permissions(code, description) VALUES
    ('CERTIFICATE_TYPE', 'Manage certificate templates')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('ADMIN', 'CERTIFICATE_TYPE'),
    ('SCHOOL_ADMIN', 'CERTIFICATE_TYPE'),
    ('TEACHER', 'CERTIFICATE_TYPE')
ON CONFLICT DO NOTHING;
