-- ============================================================
--  V123 : Lesson plan permissions + role grants
-- ============================================================

-- permissions (idempotent)
INSERT INTO permissions(code, description) VALUES
    ('LESSON_MANAGE', 'Manage lessons'),
    ('TOPIC_MANAGE', 'Manage topics'),
    ('LESSON_PLAN_MANAGE', 'Manage lesson plan entries'),

    ('LESSON_MANAGE_ASSIGNED', 'Teacher manage assigned lessons'),
    ('TOPIC_MANAGE_ASSIGNED', 'Teacher manage assigned topics'),
    ('LESSON_PLAN_MANAGE_ASSIGNED', 'Teacher manage assigned lesson plan entries'),

    ('LESSON_VIEW_OWN', 'Student view own lessons'),
    ('LESSON_VIEW_CHILD', 'Parent view child lessons'),
    ('TOPIC_VIEW_OWN', 'Student view own topics'),
    ('TOPIC_VIEW_CHILD', 'Parent view child topics'),
    ('LESSON_PLAN_VIEW_OWN', 'Student view own lesson plans'),
    ('LESSON_PLAN_VIEW_CHILD', 'Parent view child lesson plans')
ON CONFLICT (code) DO NOTHING;

-- TEACHER
INSERT INTO role_permissions(role, permission_code) VALUES
    ('TEACHER', 'LESSON_MANAGE_ASSIGNED'),
    ('TEACHER', 'TOPIC_MANAGE_ASSIGNED'),
    ('TEACHER', 'LESSON_PLAN_MANAGE_ASSIGNED')
ON CONFLICT DO NOTHING;

-- STUDENT
INSERT INTO role_permissions(role, permission_code) VALUES
    ('STUDENT', 'LESSON_VIEW_OWN'),
    ('STUDENT', 'TOPIC_VIEW_OWN'),
    ('STUDENT', 'LESSON_PLAN_VIEW_OWN')
ON CONFLICT DO NOTHING;

-- PARENT
INSERT INTO role_permissions(role, permission_code) VALUES
    ('PARENT', 'LESSON_VIEW_CHILD'),
    ('PARENT', 'TOPIC_VIEW_CHILD'),
    ('PARENT', 'LESSON_PLAN_VIEW_CHILD')
ON CONFLICT DO NOTHING;

-- SCHOOL_ADMIN
INSERT INTO role_permissions(role, permission_code) VALUES
    ('SCHOOL_ADMIN', 'LESSON_MANAGE'),
    ('SCHOOL_ADMIN', 'TOPIC_MANAGE'),
    ('SCHOOL_ADMIN', 'LESSON_PLAN_MANAGE'),
    ('SCHOOL_ADMIN', 'LESSON_MANAGE_ASSIGNED'),
    ('SCHOOL_ADMIN', 'TOPIC_MANAGE_ASSIGNED'),
    ('SCHOOL_ADMIN', 'LESSON_PLAN_MANAGE_ASSIGNED')
ON CONFLICT DO NOTHING;

-- Ensure ADMIN gets any newly-added permission codes (V119 already ran earlier)
INSERT INTO role_permissions(role, permission_code)
SELECT 'ADMIN', p.code
FROM permissions p
ON CONFLICT DO NOTHING;

