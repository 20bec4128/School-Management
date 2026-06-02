-- Grant page-permission access for the remaining hostel / transport module pages.
-- Super admins bypass page permissions, so these rows mainly keep ADMIN and
-- SCHOOL_ADMIN working under the page-permission model.

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
WHERE rf.slug IN ('manage-hostel', 'manage-room', 'vehicle', 'transport-route')
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
WHERE rf.slug IN ('manage-hostel', 'manage-room', 'vehicle', 'transport-route')
ON CONFLICT (role_name, school_id, function_id) DO NOTHING;
