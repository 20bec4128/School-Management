DELETE FROM rbac_role_page_permissions
WHERE role_name = 'SCHOOL_ADMIN'
  AND function_id IN (
    SELECT id
    FROM rbac_functions
    WHERE slug IN ('manage-school', 'general-settings')
  );

INSERT INTO rbac_role_page_permissions (role_name, school_id, function_id, can_view, can_add, can_edit, can_delete)
SELECT 'ADMIN', s.id, f.id, true, true, true, true
FROM schools s
CROSS JOIN rbac_functions f
WHERE f.slug IN ('manage-school', 'general-settings')
ON CONFLICT DO NOTHING;
