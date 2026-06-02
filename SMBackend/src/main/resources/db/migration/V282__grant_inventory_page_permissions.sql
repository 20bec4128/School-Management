-- Grant the inventory module pages to admin roles through RBAC page permissions.
-- Super admins bypass page permissions, so the important coverage here is:
--   - ADMIN global access
--   - SCHOOL_ADMIN school-scoped access

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
WHERE rf.slug IN ('sale', 'issue', 'supplier', 'warehouse', 'category', 'product', 'purchase')
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
WHERE rf.slug IN ('sale', 'issue', 'supplier', 'warehouse', 'category', 'product', 'purchase')
ON CONFLICT (role_name, school_id, function_id) DO NOTHING;
