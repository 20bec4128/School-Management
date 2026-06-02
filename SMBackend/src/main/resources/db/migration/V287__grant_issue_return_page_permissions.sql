INSERT INTO rbac_role_page_permissions (role_name, school_id, function_id, can_view, can_add, can_edit, can_delete)
SELECT 'ADMIN', NULL, f.id, true, true, true, true
FROM rbac_functions f
WHERE f.slug = 'issue-return'
ON CONFLICT DO NOTHING;

INSERT INTO rbac_role_page_permissions (role_name, school_id, function_id, can_view, can_add, can_edit, can_delete)
SELECT 'SCHOOL_ADMIN', NULL, f.id, true, true, true, true
FROM rbac_functions f
WHERE f.slug = 'issue-return'
ON CONFLICT DO NOTHING;
