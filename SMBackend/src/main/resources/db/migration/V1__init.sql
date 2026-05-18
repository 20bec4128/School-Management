-- ============================================================
--  V1 : initial schema
-- ============================================================

-- schools
CREATE TABLE IF NOT EXISTS schools (
    id                  BIGSERIAL PRIMARY KEY,
    school_url          VARCHAR(255) NOT NULL UNIQUE,
    school_code         VARCHAR(100),
    school_name         VARCHAR(255) NOT NULL,
    subscription        VARCHAR(100),
    is_demo             VARCHAR(10),
    status              VARCHAR(50),
    address             TEXT,
    phone               VARCHAR(50),
    registration_date   DATE,
    email               VARCHAR(255) NOT NULL,
    fax                 VARCHAR(50),
    footer              TEXT,
    currency            VARCHAR(50),
    currency_symbol     VARCHAR(20),
    enable_frontend     VARCHAR(10),
    exam_final_result   VARCHAR(255),
    language            VARCHAR(50),
    theme               VARCHAR(50),
    online_admission    VARCHAR(10),
    enable_rtl          VARCHAR(10),
    zoom_api_key        VARCHAR(255),
    zoom_secret         VARCHAR(255),
    google_map_url      TEXT,
    facebook_url        VARCHAR(500),
    twitter_url         VARCHAR(500),
    linkedin_url        VARCHAR(500),
    youtube_url         VARCHAR(500),
    instagram_url       VARCHAR(500),
    pinterest_url       VARCHAR(500),
    frontend_logo_url   VARCHAR(500),
    admin_logo_url      VARCHAR(500)
);

-- teachers
CREATE TABLE IF NOT EXISTS teachers (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255),
    national_id     VARCHAR(100),
    department      VARCHAR(255),
    phone           VARCHAR(50),
    gender          VARCHAR(20),
    blood_group     VARCHAR(10),
    religion        VARCHAR(100),
    birth_date      DATE,
    present_address   TEXT,
    permanent_address TEXT,
    email           VARCHAR(255),
    username        VARCHAR(100),
    password        VARCHAR(255),
    salary_grade    VARCHAR(100),
    salary_type     VARCHAR(100),
    role            VARCHAR(100),
    joining_date    DATE,
    is_view_on_web  VARCHAR(10),
    facebook_url    VARCHAR(500),
    linkedin_url    VARCHAR(500),
    twitter_url     VARCHAR(500),
    instagram_url   VARCHAR(500),
    youtube_url     VARCHAR(500),
    pinterest_url   VARCHAR(500),
    other_info      TEXT,
    photo_url       VARCHAR(500),
    resume_url      VARCHAR(500),
    display_order   INTEGER
);

-- departments
CREATE TABLE IF NOT EXISTS departments (
    id             BIGSERIAL PRIMARY KEY,
    school_id      BIGINT,
    title          VARCHAR(255),
    note           VARCHAR(500),
    is_view_on_web VARCHAR(10),
    status         VARCHAR(50),
    CONSTRAINT fk_dept_school FOREIGN KEY (school_id) REFERENCES schools (id)
);

-- student_types
CREATE TABLE IF NOT EXISTS student_types (
    id           BIGSERIAL PRIMARY KEY,
    school_id    BIGINT NOT NULL,
    student_type VARCHAR(255) NOT NULL,
    note         TEXT,
    CONSTRAINT fk_student_type_school FOREIGN KEY (school_id) REFERENCES schools (id)
);

-- students
CREATE TABLE IF NOT EXISTS students (
    id                        BIGSERIAL PRIMARY KEY,
    school_id                 BIGINT NOT NULL,
    name                      VARCHAR(100) NOT NULL,
    admission_no              VARCHAR(50)  NOT NULL UNIQUE,
    admission_date            DATE,
    birth_date                DATE,
    gender                    VARCHAR(20),
    blood_group               VARCHAR(10),
    religion                  VARCHAR(50),
    caste                     VARCHAR(50),
    phone                     VARCHAR(20),
    email                     VARCHAR(100),
    national_id               VARCHAR(50),
    student_type              VARCHAR(50),
    class_name                VARCHAR(20),
    section                   VARCHAR(10),
    group_name                VARCHAR(50),
    roll_no                   VARCHAR(20),
    registration_no           VARCHAR(50),
    discount                  VARCHAR(20),
    second_language           VARCHAR(50),
    is_guardian               VARCHAR(20),
    relation_with_guardian    VARCHAR(50),
    father_name               VARCHAR(100),
    father_phone              VARCHAR(20),
    father_education          VARCHAR(100),
    father_profession         VARCHAR(100),
    father_designation        VARCHAR(100),
    father_photo_url          VARCHAR(500),
    mother_name               VARCHAR(100),
    mother_phone              VARCHAR(20),
    mother_education          VARCHAR(100),
    mother_profession         VARCHAR(100),
    mother_designation        VARCHAR(100),
    mother_photo_url          VARCHAR(500),
    present_address           TEXT,
    permanent_address         TEXT,
    same_as_guardian_address  BOOLEAN DEFAULT FALSE,
    previous_school_name      VARCHAR(200),
    previous_class            VARCHAR(50),
    transfer_certificate_url  VARCHAR(500),
    username                  VARCHAR(50)  NOT NULL UNIQUE,
    password                  VARCHAR(255) NOT NULL,
    health_condition          VARCHAR(200),
    other_info                TEXT,
    photo_url                 VARCHAR(500),
    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted                   BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_student_school FOREIGN KEY (school_id) REFERENCES schools (id)
);

CREATE INDEX IF NOT EXISTS idx_students_school_id     ON students (school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students (class_name, section);
CREATE INDEX IF NOT EXISTS idx_students_admission_no  ON students (admission_no);
CREATE INDEX IF NOT EXISTS idx_students_username      ON students (username);
