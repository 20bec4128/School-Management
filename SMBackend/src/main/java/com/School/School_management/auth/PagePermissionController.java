package com.School.School_management.auth;

import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rbac/page-permissions")
public class PagePermissionController {

    private final JdbcTemplate jdbcTemplate;
    private final SchoolGuard schoolGuard;

    public PagePermissionController(JdbcTemplate jdbcTemplate, SchoolGuard schoolGuard) {
        this.jdbcTemplate = jdbcTemplate;
        this.schoolGuard = schoolGuard;
    }

    public record ModuleDto(Integer id, String name, Integer orderNo, List<FunctionDto> functions) {}
    public record FunctionDto(Integer id, Integer moduleId, String name, String slug, Integer orderNo) {}
    public record FunctionPermissionDto(String slug, boolean canView, boolean canAdd, boolean canEdit, boolean canDelete) {}
    public record SavePermissionsRequest(List<FunctionPermissionDto> permissions) {}

    @GetMapping("/modules")
    public List<ModuleDto> listModules() {
        List<ModuleDto> modules = jdbcTemplate.query(
                "SELECT id, name, order_no FROM rbac_modules ORDER BY order_no",
                (rs, rowNum) -> new ModuleDto(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getInt("order_no"),
                        new ArrayList<>()
                )
        );

        List<FunctionDto> functions = jdbcTemplate.query(
                "SELECT id, module_id, name, slug, order_no FROM rbac_functions ORDER BY order_no",
                (rs, rowNum) -> new FunctionDto(
                        rs.getInt("id"),
                        rs.getInt("module_id"),
                        rs.getString("name"),
                        rs.getString("slug"),
                        rs.getInt("order_no")
                )
        );

        Map<Integer, ModuleDto> moduleMap = modules.stream().collect(Collectors.toMap(ModuleDto::id, m -> m));
        for (FunctionDto f : functions) {
            ModuleDto m = moduleMap.get(f.moduleId());
            if (m != null) {
                m.functions().add(f);
            }
        }

        return modules;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyPagePermissions() {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        if (user.isSuperAdmin()) {
            return ResponseEntity.ok(Map.of("superAdmin", true));
        }

        String role = user.role();
        Long schoolId = user.schoolId();

        List<FunctionPermissionDto> perms;
        if (schoolId != null) {
            perms = jdbcTemplate.query(
                    """
                    SELECT rf.slug,
                           COALESCE(school.can_view,   global.can_view,   false) AS can_view,
                           COALESCE(school.can_add,    global.can_add,    false) AS can_add,
                           COALESCE(school.can_edit,   global.can_edit,   false) AS can_edit,
                           COALESCE(school.can_delete, global.can_delete, false) AS can_delete
                    FROM rbac_functions rf
                    LEFT JOIN rbac_role_page_permissions school
                           ON school.function_id = rf.id AND school.role_name = ? AND school.school_id = ?
                    LEFT JOIN rbac_role_page_permissions global
                           ON global.function_id = rf.id AND global.role_name = ? AND global.school_id IS NULL
                    """,
                    (rs, rowNum) -> new FunctionPermissionDto(
                            rs.getString("slug"),
                            rs.getBoolean("can_view"),
                            rs.getBoolean("can_add"),
                            rs.getBoolean("can_edit"),
                            rs.getBoolean("can_delete")
                    ),
                    role, schoolId, role
            );
        } else {
            perms = jdbcTemplate.query(
                    """
                    SELECT rf.slug,
                           COALESCE(global.can_view,   false) AS can_view,
                           COALESCE(global.can_add,    false) AS can_add,
                           COALESCE(global.can_edit,   false) AS can_edit,
                           COALESCE(global.can_delete, false) AS can_delete
                    FROM rbac_functions rf
                    LEFT JOIN rbac_role_page_permissions global
                           ON global.function_id = rf.id AND global.role_name = ? AND global.school_id IS NULL
                    """,
                    (rs, rowNum) -> new FunctionPermissionDto(
                            rs.getString("slug"),
                            rs.getBoolean("can_view"),
                            rs.getBoolean("can_add"),
                            rs.getBoolean("can_edit"),
                            rs.getBoolean("can_delete")
                    ),
                    role
            );
        }

        Map<String, Map<String, Boolean>> result = new HashMap<>();
        for (FunctionPermissionDto p : perms) {
            Map<String, Boolean> crud = new HashMap<>();
            crud.put("view", p.canView());
            crud.put("add", p.canAdd());
            crud.put("edit", p.canEdit());
            crud.put("delete", p.canDelete());
            result.put(p.slug(), crud);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{role}")
    @RequirePermission({"RBAC_MANAGE", "SCHOOL_RBAC_MANAGE", "*"})
    public List<FunctionPermissionDto> getRolePagePermissions(
            @PathVariable String role,
            @RequestParam(required = false) Long schoolId
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (schoolId != null) {
            schoolGuard.schoolIdForRead(user, schoolId);
            return jdbcTemplate.query(
                    """
                    SELECT rf.slug,
                           COALESCE(p.can_view, false) AS can_view,
                           COALESCE(p.can_add, false) AS can_add,
                           COALESCE(p.can_edit, false) AS can_edit,
                           COALESCE(p.can_delete, false) AS can_delete
                    FROM rbac_functions rf
                    LEFT JOIN rbac_role_page_permissions p
                           ON p.function_id = rf.id AND p.role_name = ? AND p.school_id = ?
                    """,
                    (rs, rowNum) -> new FunctionPermissionDto(
                            rs.getString("slug"),
                            rs.getBoolean("can_view"),
                            rs.getBoolean("can_add"),
                            rs.getBoolean("can_edit"),
                            rs.getBoolean("can_delete")
                    ),
                    role, schoolId
            );
        } else {
            if (user.isSchoolScoped()) {
                throw new ForbiddenException("School scoped users cannot query global templates");
            }
            return jdbcTemplate.query(
                    """
                    SELECT rf.slug,
                           COALESCE(p.can_view, false) AS can_view,
                           COALESCE(p.can_add, false) AS can_add,
                           COALESCE(p.can_edit, false) AS can_edit,
                           COALESCE(p.can_delete, false) AS can_delete
                    FROM rbac_functions rf
                    LEFT JOIN rbac_role_page_permissions p
                           ON p.function_id = rf.id AND p.role_name = ? AND p.school_id IS NULL
                    """,
                    (rs, rowNum) -> new FunctionPermissionDto(
                            rs.getString("slug"),
                            rs.getBoolean("can_view"),
                            rs.getBoolean("can_add"),
                            rs.getBoolean("can_edit"),
                            rs.getBoolean("can_delete")
                    ),
                    role
            );
        }
    }

    @PutMapping("/{role}")
    @RequirePermission({"RBAC_MANAGE", "SCHOOL_RBAC_MANAGE", "*"})
    @Transactional
    public ResponseEntity<?> saveRolePagePermissions(
            @PathVariable String role,
            @RequestParam(required = false) Long schoolId,
            @RequestBody SavePermissionsRequest req
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (schoolId != null) {
            schoolGuard.schoolIdForWrite(user, schoolId);
        } else {
            if (user.isSchoolScoped()) {
                throw new ForbiddenException("School scoped users cannot modify global templates");
            }
        }

        // Delete existing settings
        if (schoolId != null) {
            jdbcTemplate.update(
                    "DELETE FROM rbac_role_page_permissions WHERE role_name = ? AND school_id = ?",
                    role, schoolId
            );
        } else {
            jdbcTemplate.update(
                    "DELETE FROM rbac_role_page_permissions WHERE role_name = ? AND school_id IS NULL",
                    role
            );
        }

        if (req == null || req.permissions() == null || req.permissions().isEmpty()) {
            return ResponseEntity.ok(Map.of("ok", true));
        }

        // Fetch functions to map slugs to IDs
        Map<String, Integer> functionMap = jdbcTemplate.query(
                "SELECT id, slug FROM rbac_functions",
                (rs, rowNum) -> Map.entry(rs.getString("slug"), rs.getInt("id"))
        ).stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        for (FunctionPermissionDto p : req.permissions()) {
            Integer functionId = functionMap.get(p.slug());
            if (functionId == null) continue;

            // Only insert if at least one checkbox is enabled
            if (p.canView() || p.canAdd() || p.canEdit() || p.canDelete()) {
                jdbcTemplate.update(
                        """
                        INSERT INTO rbac_role_page_permissions 
                          (role_name, school_id, function_id, can_view, can_add, can_edit, can_delete)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (role_name, school_id, function_id) 
                        DO UPDATE SET 
                          can_view = EXCLUDED.can_view,
                          can_add = EXCLUDED.can_add,
                          can_edit = EXCLUDED.can_edit,
                          can_delete = EXCLUDED.can_delete
                        """,
                        role, schoolId, functionId, p.canView(), p.canAdd(), p.canEdit(), p.canDelete()
                );
            }
        }

        return ResponseEntity.ok(Map.of("ok", true));
    }
}
