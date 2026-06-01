-- Grant head office admin lookup access to the head offices page list.
-- This endpoint is used as a shared lookup by admin pages such as Question Bank
-- and Exam Instruction, so the page must be visible to head-office scoped ADMIN users.

UPDATE rbac_role_page_permissions rpp
SET can_view = true
WHERE rpp.role_name = 'ADMIN'
  AND rpp.school_id IS NULL
  AND rpp.function_id = (
      SELECT rf.id
      FROM rbac_functions rf
      WHERE rf.slug = 'head-offices'
  );

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
    false,
    false,
    false
FROM rbac_functions rf
WHERE rf.slug = 'head-offices'
  AND NOT EXISTS (
      SELECT 1
      FROM rbac_role_page_permissions rpp
      WHERE rpp.role_name = 'ADMIN'
        AND rpp.school_id IS NULL
        AND rpp.function_id = rf.id
  );
