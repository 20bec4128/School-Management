-- ============================================================
--  V125 : Scoped custom roles (head-office templates + per-school roles)
-- ============================================================

-- Head-office template roles (applied to all schools under the head office)
CREATE TABLE IF NOT EXISTS head_office_custom_roles (
    head_office_id  BIGINT      NOT NULL,
    name            VARCHAR(50) NOT NULL,
    description     VARCHAR(500),
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (head_office_id, name),
    CONSTRAINT fk_hocr_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hocr_head_office_id ON head_office_custom_roles(head_office_id);

CREATE TABLE IF NOT EXISTS head_office_custom_role_permissions (
    head_office_id  BIGINT       NOT NULL,
    role            VARCHAR(50)  NOT NULL,
    permission_code VARCHAR(150) NOT NULL,
    PRIMARY KEY (head_office_id, role, permission_code),
    CONSTRAINT fk_hocrp_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id) ON DELETE CASCADE,
    CONSTRAINT fk_hocrp_permission FOREIGN KEY (permission_code) REFERENCES permissions(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hocrp_head_office_role ON head_office_custom_role_permissions(head_office_id, role);

-- Per-school custom roles
CREATE TABLE IF NOT EXISTS school_custom_roles (
    school_id       BIGINT      NOT NULL,
    name            VARCHAR(50) NOT NULL,
    description     VARCHAR(500),
    source          VARCHAR(30) NOT NULL DEFAULT 'SCHOOL', -- SCHOOL | HEAD_OFFICE
    head_office_id  BIGINT,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (school_id, name),
    CONSTRAINT fk_scr_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_scr_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scr_school_id ON school_custom_roles(school_id);
CREATE INDEX IF NOT EXISTS idx_scr_head_office_id ON school_custom_roles(head_office_id);
CREATE INDEX IF NOT EXISTS idx_scr_source ON school_custom_roles(source);

CREATE TABLE IF NOT EXISTS school_custom_role_permissions (
    school_id       BIGINT       NOT NULL,
    role            VARCHAR(50)  NOT NULL,
    permission_code VARCHAR(150) NOT NULL,
    PRIMARY KEY (school_id, role, permission_code),
    CONSTRAINT fk_scrp_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_scrp_permission FOREIGN KEY (permission_code) REFERENCES permissions(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scrp_school_role ON school_custom_role_permissions(school_id, role);

