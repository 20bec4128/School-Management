-- ============================================================
--  V104 : RBAC + admin/parent auth tables
-- ============================================================

-- permissions
CREATE TABLE IF NOT EXISTS permissions (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(150) NOT NULL UNIQUE,
    description VARCHAR(500)
);

-- role_permissions (role is a string enum in app code)
CREATE TABLE IF NOT EXISTS role_permissions (
    role            VARCHAR(50)  NOT NULL,
    permission_code VARCHAR(150) NOT NULL,
    PRIMARY KEY (role, permission_code),
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_code) REFERENCES permissions(code)
);

-- admin users (SUPER_ADMIN + school-scoped ADMIN)
CREATE TABLE IF NOT EXISTS admin_users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL,
    school_id     BIGINT,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_admin_users_role CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
    CONSTRAINT fk_admin_users_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT chk_admin_users_school_scope CHECK (
        (role = 'SUPER_ADMIN' AND school_id IS NULL) OR
        (role = 'ADMIN' AND school_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_school_id ON admin_users(school_id);

-- parents
CREATE TABLE IF NOT EXISTS parents (
    id            BIGSERIAL PRIMARY KEY,
    school_id     BIGINT       NOT NULL,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255),
    phone         VARCHAR(50),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parents_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_parents_school_id ON parents(school_id);

-- parent_students mapping
CREATE TABLE IF NOT EXISTS parent_students (
    parent_id  BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    PRIMARY KEY (parent_id, student_id),
    CONSTRAINT fk_parent_students_parent FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_students_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON parent_students(student_id);

-- ------------------------------------------------------------
-- Seed permissions (idempotent)
-- ------------------------------------------------------------
INSERT INTO permissions(code, description) VALUES
    -- common
    ('DASHBOARD_VIEW', 'View dashboard'),
    ('PROFILE_VIEW', 'View profile'),
    ('PROFILE_UPDATE_LIMITED', 'Update limited profile fields'),

    -- class/section/subject
    ('CLASS_VIEW_ASSIGNED', 'Teacher view assigned classes'),
    ('CLASS_VIEW_OWN', 'Student view own class'),
    ('CLASS_VIEW_CHILD', 'Parent view child class'),

    ('SECTION_VIEW_ASSIGNED', 'Teacher view assigned sections'),
    ('SECTION_VIEW_OWN', 'Student view own section'),
    ('SECTION_VIEW_CHILD', 'Parent view child section'),

    ('SUBJECT_VIEW_ASSIGNED', 'Teacher view assigned subjects'),
    ('SUBJECT_MANAGE_ASSIGNED', 'Teacher manage assigned subjects'),
    ('SUBJECT_VIEW_OWN', 'Student view own subjects'),
    ('SUBJECT_VIEW_CHILD', 'Parent view child subjects'),

    -- syllabus/materials
    ('SYLLABUS_MANAGE_ASSIGNED', 'Teacher manage assigned syllabus'),
    ('SYLLABUS_VIEW_OWN', 'Student view own syllabus'),
    ('SYLLABUS_VIEW_CHILD', 'Parent view child syllabus'),

    ('STUDY_MATERIAL_MANAGE_ASSIGNED', 'Teacher manage assigned study materials'),
    ('STUDY_MATERIAL_VIEW_OWN', 'Student view own study materials'),
    ('STUDY_MATERIAL_VIEW_CHILD', 'Parent view child study materials'),

    -- live class
    ('LIVE_CLASS_MANAGE_ASSIGNED', 'Teacher manage assigned live classes'),
    ('LIVE_CLASS_VIEW_OWN', 'Student view own live classes'),
    ('LIVE_CLASS_VIEW_CHILD', 'Parent view child live classes'),
    ('LIVE_CLASS_JOIN', 'Student join live class'),

    -- assignment/submission
    ('ASSIGNMENT_MANAGE_ASSIGNED', 'Teacher manage assigned assignments'),
    ('ASSIGNMENT_VIEW_OWN', 'Student view own assignments'),
    ('ASSIGNMENT_VIEW_CHILD', 'Parent view child assignments'),
    ('ASSIGNMENT_SUBMIT', 'Student submit assignment'),
    ('ASSIGNMENT_SUBMISSION_VIEW_OWN', 'Student view own submissions'),
    ('ASSIGNMENT_SUBMISSION_VIEW_CHILD', 'Parent view child submissions'),

    ('SUBMISSION_VIEW_ASSIGNED', 'Teacher view assigned submissions'),
    ('SUBMISSION_EVALUATE_ASSIGNED', 'Teacher evaluate assigned submissions'),
    ('SUBMISSION_VIEW_OWN', 'Student view own submissions'),
    ('SUBMISSION_VIEW_CHILD', 'Parent view child submissions'),

    -- attendance/exams/fees/etc (seeded for UI gating; backend may add endpoints later)
    ('ATTENDANCE_VIEW_OWN', 'Student view own attendance'),
    ('ATTENDANCE_VIEW_CHILD', 'Parent view child attendance'),
    ('EXAM_VIEW_OWN', 'Student view own exams'),
    ('EXAM_VIEW_CHILD', 'Parent view child exams'),
    ('EXAM_MARK_VIEW_OWN', 'Student view own marks'),
    ('EXAM_MARK_VIEW_CHILD', 'Parent view child marks'),
    ('RESULT_VIEW_OWN', 'Student view own results'),
    ('RESULT_VIEW_CHILD', 'Parent view child results'),
    ('REPORT_CARD_VIEW_OWN', 'Student view own report card'),
    ('REPORT_CARD_VIEW_CHILD', 'Parent view child report card'),
    ('FEES_VIEW_OWN', 'Student view own fees'),
    ('FEES_VIEW_CHILD', 'Parent view child fees'),
    ('FEES_PAYMENT_VIEW_OWN', 'Student view own payments'),
    ('FEES_PAYMENT_VIEW_CHILD', 'Parent view child payments'),

    -- notifications / announcements
    ('NOTICE_VIEW', 'View notices'),
    ('NEWS_VIEW', 'View news'),
    ('HOLIDAY_VIEW', 'View holidays'),
    ('EVENT_VIEW', 'View events'),
    ('GALLERY_VIEW', 'View gallery'),
    ('NOTIFICATION_VIEW_OWN', 'Student view own notifications'),
    ('NOTIFICATION_VIEW_CHILD', 'Parent view child notifications'),
    ('ANNOUNCEMENT_VIEW', 'View announcements'),

    -- complaint
    ('COMPLAINT_CREATE', 'Create complaint'),
    ('COMPLAINT_VIEW_OWN', 'View own complaint'),
    ('COMPLAINT_VIEW_CHILD', 'View child complaint'),

    -- admin/school management (backend enforcement uses role + scoping)
    ('SCHOOL_MANAGE', 'Manage schools'),
    ('STUDENT_MANAGE', 'Manage students'),
    ('TEACHER_MANAGE', 'Manage teachers')
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------
-- Seed role permissions (idempotent)
-- ------------------------------------------------------------
-- STUDENT
INSERT INTO role_permissions(role, permission_code) VALUES
    ('STUDENT', 'DASHBOARD_VIEW'),
    ('STUDENT', 'PROFILE_VIEW'),
    ('STUDENT', 'PROFILE_UPDATE_LIMITED'),
    ('STUDENT', 'CLASS_VIEW_OWN'),
    ('STUDENT', 'SECTION_VIEW_OWN'),
    ('STUDENT', 'SUBJECT_VIEW_OWN'),
    ('STUDENT', 'SYLLABUS_VIEW_OWN'),
    ('STUDENT', 'STUDY_MATERIAL_VIEW_OWN'),
    ('STUDENT', 'LIVE_CLASS_VIEW_OWN'),
    ('STUDENT', 'LIVE_CLASS_JOIN'),
    ('STUDENT', 'ASSIGNMENT_VIEW_OWN'),
    ('STUDENT', 'ASSIGNMENT_SUBMIT'),
    ('STUDENT', 'ASSIGNMENT_SUBMISSION_VIEW_OWN'),
    ('STUDENT', 'SUBMISSION_VIEW_OWN'),
    ('STUDENT', 'ATTENDANCE_VIEW_OWN'),
    ('STUDENT', 'EXAM_VIEW_OWN'),
    ('STUDENT', 'EXAM_MARK_VIEW_OWN'),
    ('STUDENT', 'RESULT_VIEW_OWN'),
    ('STUDENT', 'REPORT_CARD_VIEW_OWN'),
    ('STUDENT', 'FEES_VIEW_OWN'),
    ('STUDENT', 'FEES_PAYMENT_VIEW_OWN'),
    ('STUDENT', 'NOTICE_VIEW'),
    ('STUDENT', 'NEWS_VIEW'),
    ('STUDENT', 'HOLIDAY_VIEW'),
    ('STUDENT', 'EVENT_VIEW'),
    ('STUDENT', 'GALLERY_VIEW'),
    ('STUDENT', 'COMPLAINT_CREATE'),
    ('STUDENT', 'COMPLAINT_VIEW_OWN'),
    ('STUDENT', 'NOTIFICATION_VIEW_OWN')
ON CONFLICT DO NOTHING;

-- PARENT
INSERT INTO role_permissions(role, permission_code) VALUES
    ('PARENT', 'DASHBOARD_VIEW'),
    ('PARENT', 'PROFILE_VIEW'),
    ('PARENT', 'PROFILE_UPDATE_LIMITED'),
    ('PARENT', 'CLASS_VIEW_CHILD'),
    ('PARENT', 'SECTION_VIEW_CHILD'),
    ('PARENT', 'SUBJECT_VIEW_CHILD'),
    ('PARENT', 'SYLLABUS_VIEW_CHILD'),
    ('PARENT', 'STUDY_MATERIAL_VIEW_CHILD'),
    ('PARENT', 'LIVE_CLASS_VIEW_CHILD'),
    ('PARENT', 'ASSIGNMENT_VIEW_CHILD'),
    ('PARENT', 'ASSIGNMENT_SUBMISSION_VIEW_CHILD'),
    ('PARENT', 'SUBMISSION_VIEW_CHILD'),
    ('PARENT', 'ATTENDANCE_VIEW_CHILD'),
    ('PARENT', 'EXAM_VIEW_CHILD'),
    ('PARENT', 'EXAM_MARK_VIEW_CHILD'),
    ('PARENT', 'RESULT_VIEW_CHILD'),
    ('PARENT', 'REPORT_CARD_VIEW_CHILD'),
    ('PARENT', 'FEES_VIEW_CHILD'),
    ('PARENT', 'FEES_PAYMENT_VIEW_CHILD'),
    ('PARENT', 'NOTICE_VIEW'),
    ('PARENT', 'NEWS_VIEW'),
    ('PARENT', 'HOLIDAY_VIEW'),
    ('PARENT', 'EVENT_VIEW'),
    ('PARENT', 'GALLERY_VIEW'),
    ('PARENT', 'COMPLAINT_CREATE'),
    ('PARENT', 'COMPLAINT_VIEW_CHILD'),
    ('PARENT', 'NOTIFICATION_VIEW_CHILD')
ON CONFLICT DO NOTHING;

-- TEACHER (minimal set for current backend routes)
INSERT INTO role_permissions(role, permission_code) VALUES
    ('TEACHER', 'DASHBOARD_VIEW'),
    ('TEACHER', 'PROFILE_VIEW'),
    ('TEACHER', 'PROFILE_UPDATE_LIMITED'),
    ('TEACHER', 'CLASS_VIEW_ASSIGNED'),
    ('TEACHER', 'SECTION_VIEW_ASSIGNED'),
    ('TEACHER', 'SUBJECT_VIEW_ASSIGNED'),
    ('TEACHER', 'SUBJECT_MANAGE_ASSIGNED'),
    ('TEACHER', 'SYLLABUS_MANAGE_ASSIGNED'),
    ('TEACHER', 'STUDY_MATERIAL_MANAGE_ASSIGNED'),
    ('TEACHER', 'LIVE_CLASS_MANAGE_ASSIGNED'),
    ('TEACHER', 'ASSIGNMENT_MANAGE_ASSIGNED'),
    ('TEACHER', 'SUBMISSION_VIEW_ASSIGNED'),
    ('TEACHER', 'SUBMISSION_EVALUATE_ASSIGNED'),
    ('TEACHER', 'ANNOUNCEMENT_VIEW'),
    ('TEACHER', 'COMPLAINT_CREATE'),
    ('TEACHER', 'COMPLAINT_VIEW_OWN')
ON CONFLICT DO NOTHING;

