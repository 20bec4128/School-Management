-- Grant the Teacher Department page to admin roles under the page-permission model.
-- The frontend uses the `teacher-department` page key, so the backend controller
-- must authorize against the same slug.

INSERT INTO rbac_role_page_permissions (
    role_name,
    school_id,
    function_id,
    can_view,
    can_add,
    can_edit,
    can_delete
)
SELECT
    'ADMIN',
    NULL,
    rf.id,
    true,
    true,
    true,
    true
FROM rbac_functions rf
WHERE rf.slug = 'teacher-department'
ON CONFLICT (role_name, school_id, function_id) DO NOTHING;

INSERT INTO rbac_role_page_permissions (
    role_name,
    school_id,
    function_id,
    can_view,
    can_add,
    can_edit,
    can_delete
)
SELECT
    'SCHOOL_ADMIN',
    s.id,
    rf.id,
    true,
    true,
    true,
    true
FROM rbac_functions rf
JOIN schools s
  ON s.is_deleted = false
WHERE rf.slug = 'teacher-department'
ON CONFLICT (role_name, school_id, function_id) DO NOTHING;
