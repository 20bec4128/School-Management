-- Class Routine permissions (RBAC)

INSERT INTO permissions(code, description) VALUES
    ('CLASS_ROUTINE_VIEW', 'View class routines'),
    ('CLASS_ROUTINE_MANAGE', 'Create/update/delete class routines')
ON CONFLICT (code) DO NOTHING;

-- Give TEACHER manage and STUDENT/PARENT view by default (adjust as needed)
INSERT INTO role_permissions(role, permission_code) VALUES
    ('TEACHER', 'CLASS_ROUTINE_MANAGE'),
    ('STUDENT', 'CLASS_ROUTINE_VIEW'),
    ('PARENT', 'CLASS_ROUTINE_VIEW')
ON CONFLICT DO NOTHING;

