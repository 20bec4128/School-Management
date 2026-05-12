-- Per-school permission overrides for built-in roles (TEACHER/STUDENT/PARENT, etc.)
-- If rows exist for (school_id, role), those permissions replace the global role_permissions for that school.

CREATE TABLE IF NOT EXISTS school_role_permissions (
    school_id       BIGINT       NOT NULL,
    role            VARCHAR(50)   NOT NULL,
    permission_code VARCHAR(150)  NOT NULL,
    PRIMARY KEY (school_id, role, permission_code),
    CONSTRAINT fk_school_role_permissions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_school_role_permissions_permission FOREIGN KEY (permission_code) REFERENCES permissions(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_school_role_permissions_school_role ON school_role_permissions(school_id, role);

INSERT INTO permissions(code, description) VALUES
    ('SCHOOL_RBAC_MANAGE', 'Manage role permissions within a school')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('SCHOOL_ADMIN', 'SCHOOL_RBAC_MANAGE')
ON CONFLICT DO NOTHING;

