package com.School.School_management.auth;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rbac")
@RequirePermission({"RBAC_MANAGE", "*"})
public class RbacAdminController {

    private static final Pattern ROLE_NAME = Pattern.compile("^[A-Z0-9_]{3,50}$");

    private final JdbcTemplate jdbcTemplate;
    private final RbacService rbacService;

    public RbacAdminController(JdbcTemplate jdbcTemplate, RbacService rbacService) {
        this.jdbcTemplate = jdbcTemplate;
        this.rbacService = rbacService;
    }

    public record PermissionDto(String code, String description) {}

    public record RoleDto(String name, String description, List<String> permissions) {}

    public record CreateRoleRequest(String name, String description, List<String> permissions) {}

    public record UpdateRolePermissionsRequest(List<String> permissions) {}

    @GetMapping("/permissions")
    public List<PermissionDto> listPermissions() {
        return jdbcTemplate.query(
                "SELECT code, description FROM permissions ORDER BY code",
                (rs, rowNum) -> new PermissionDto(rs.getString("code"), rs.getString("description"))
        );
    }

    @GetMapping("/roles")
    public List<RoleDto> listRoles() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT r.name as role_name, r.description as role_description, rp.permission_code as permission_code
                FROM roles r
                LEFT JOIN role_permissions rp ON rp.role = r.name
                ORDER BY r.name, rp.permission_code
                """
        );

        Map<String, RoleDtoBuilder> byRole = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String name = String.valueOf(row.get("role_name"));
            String description = row.get("role_description") == null ? null : String.valueOf(row.get("role_description"));
            String perm = row.get("permission_code") == null ? null : String.valueOf(row.get("permission_code"));

            RoleDtoBuilder builder = byRole.computeIfAbsent(name, (k) -> new RoleDtoBuilder(name, description));
            if (perm != null && !perm.isBlank()) builder.permissions.add(perm);
        }

        List<RoleDto> result = new ArrayList<>();
        for (RoleDtoBuilder b : byRole.values()) {
            if ("SUPER_ADMIN".equalsIgnoreCase(b.name)) {
                result.add(new RoleDto("SUPER_ADMIN", b.description, List.of("*")));
            } else {
                result.add(new RoleDto(b.name, b.description, b.permissions.stream().distinct().sorted().toList()));
            }
        }
        return result;
    }

    @PostMapping("/roles")
    @Transactional
    public ResponseEntity<?> createRole(@RequestBody CreateRoleRequest req) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Forbidden"));

        String role = req == null ? null : normalizeRole(req.name());
        if (role == null || !ROLE_NAME.matcher(role).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid role name"));
        }
        if ("SUPER_ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "SUPER_ADMIN cannot be created"));
        }

        String description = req == null ? null : normalizeDescription(req.description());
        List<String> perms = req == null || req.permissions() == null ? List.of() : req.permissions();

        try {
            jdbcTemplate.update(
                    "INSERT INTO roles(name, description) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
                    role,
                    description
            );

            for (String p : perms) {
                String code = normalizePermission(p);
                if (code == null) continue;
                if (!user.hasPermission(code)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Cannot grant permission you do not own: " + code));
                }
                jdbcTemplate.update(
                        "INSERT INTO role_permissions(role, permission_code) VALUES (?, ?) ON CONFLICT DO NOTHING",
                        role,
                        code
                );
            }
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid permission code"));
        }

        rbacService.evict(role);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PutMapping("/roles/{role}/permissions")
    @Transactional
    public ResponseEntity<?> replaceRolePermissions(
            @PathVariable String role,
            @RequestBody UpdateRolePermissionsRequest req
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Forbidden"));

        String normalizedRole = normalizeRole(role);
        if (normalizedRole == null || !ROLE_NAME.matcher(normalizedRole).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid role name"));
        }
        if ("SUPER_ADMIN".equals(normalizedRole)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "SUPER_ADMIN cannot be edited"));
        }

        List<String> perms = req == null || req.permissions() == null ? List.of() : req.permissions();
        if ("SCHOOL_ADMIN".equalsIgnoreCase(normalizedRole) && (perms == null || !perms.contains("SCHOOL_RBAC_MANAGE"))) {
            // Prevent locking out school admins from managing school RBAC.
            perms = new ArrayList<>(perms == null ? List.of() : perms);
            perms.add("SCHOOL_RBAC_MANAGE");
        }

        try {
            jdbcTemplate.update("DELETE FROM role_permissions WHERE role = ?", normalizedRole);
            for (String p : perms) {
                String code = normalizePermission(p);
                if (code == null) continue;
                if (!user.hasPermission(code)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Cannot grant permission you do not own: " + code));
                }
                jdbcTemplate.update(
                        "INSERT INTO role_permissions(role, permission_code) VALUES (?, ?) ON CONFLICT DO NOTHING",
                        normalizedRole,
                        code
                );
            }
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid permission code"));
        }

        rbacService.evict(normalizedRole);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private String normalizeRole(String value) {
        if (value == null) return null;
        String trimmed = value.trim().toUpperCase();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizePermission(String value) {
        if (value == null) return null;
        String trimmed = value.trim().toUpperCase();
        if (trimmed.isEmpty()) return null;
        if ("*".equals(trimmed)) return null;
        return trimmed;
    }

    private String normalizeDescription(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static final class RoleDtoBuilder {
        final String name;
        final String description;
        final List<String> permissions = new ArrayList<>();

        RoleDtoBuilder(String name, String description) {
            this.name = name;
            this.description = description;
        }
    }
}
