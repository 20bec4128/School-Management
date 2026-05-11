INSERT INTO permissions(code, description) VALUES
    ('ADMIN_USER_MANAGE', 'Manage platform and school admin users'),
    ('DEPARTMENT_MANAGE', 'Manage school departments'),
    ('CLASS_MANAGE', 'Manage school classes'),
    ('SECTION_MANAGE', 'Manage school sections'),
    ('SUBJECT_MANAGE', 'Manage school subjects'),
    ('SYLLABUS_MANAGE', 'Manage school syllabuses'),
    ('STUDY_MATERIAL_MANAGE', 'Manage school study materials'),
    ('LIVE_CLASS_MANAGE', 'Manage school live classes'),
    ('ASSIGNMENT_MANAGE', 'Manage school assignments'),
    ('SUBMISSION_MANAGE', 'Manage school submissions')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role, permission_code)
SELECT 'ADMIN', p.code
FROM permissions p
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role, permission_code) VALUES
    ('SCHOOL_ADMIN', 'DASHBOARD_VIEW'),
    ('SCHOOL_ADMIN', 'PROFILE_VIEW'),
    ('SCHOOL_ADMIN', 'DEPARTMENT_MANAGE'),
    ('SCHOOL_ADMIN', 'CLASS_MANAGE'),
    ('SCHOOL_ADMIN', 'SECTION_MANAGE'),
    ('SCHOOL_ADMIN', 'SUBJECT_MANAGE'),
    ('SCHOOL_ADMIN', 'TEACHER_MANAGE'),
    ('SCHOOL_ADMIN', 'STUDENT_MANAGE'),
    ('SCHOOL_ADMIN', 'SYLLABUS_MANAGE'),
    ('SCHOOL_ADMIN', 'STUDY_MATERIAL_MANAGE'),
    ('SCHOOL_ADMIN', 'LIVE_CLASS_MANAGE'),
    ('SCHOOL_ADMIN', 'ASSIGNMENT_MANAGE'),
    ('SCHOOL_ADMIN', 'SUBMISSION_MANAGE'),
    ('SCHOOL_ADMIN', 'CLASS_VIEW_ASSIGNED'),
    ('SCHOOL_ADMIN', 'SECTION_VIEW_ASSIGNED'),
    ('SCHOOL_ADMIN', 'SUBJECT_VIEW_ASSIGNED'),
    ('SCHOOL_ADMIN', 'SUBJECT_MANAGE_ASSIGNED'),
    ('SCHOOL_ADMIN', 'SYLLABUS_MANAGE_ASSIGNED'),
    ('SCHOOL_ADMIN', 'STUDY_MATERIAL_MANAGE_ASSIGNED'),
    ('SCHOOL_ADMIN', 'LIVE_CLASS_MANAGE_ASSIGNED'),
    ('SCHOOL_ADMIN', 'ASSIGNMENT_MANAGE_ASSIGNED'),
    ('SCHOOL_ADMIN', 'SUBMISSION_VIEW_ASSIGNED'),
    ('SCHOOL_ADMIN', 'SUBMISSION_EVALUATE_ASSIGNED')
ON CONFLICT DO NOTHING;
