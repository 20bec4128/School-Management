package com.School.School_management.auth;

import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/school-rbac")
@RequirePermission({"SCHOOL_RBAC_MANAGE", "RBAC_MANAGE", "*"})
public class SchoolRbacController {

    private static final Pattern ROLE_NAME = Pattern.compile("^[A-Z0-9_]{3,50}$");
    private static final String PERM_HEAD_OFFICE_MANAGE = "HEAD_OFFICE_MANAGE";
    private static final String PERM_HEAD_OFFICE_SCHOOL_MANAGE = "HEAD_OFFICE_SCHOOL_MANAGE";

    private final JdbcTemplate jdbcTemplate;
    private final RbacService rbacService;
    private final SchoolGuard schoolGuard;

    public SchoolRbacController(JdbcTemplate jdbcTemplate, RbacService rbacService, SchoolGuard schoolGuard) {
        this.jdbcTemplate = jdbcTemplate;
        this.rbacService = rbacService;
        this.schoolGuard = schoolGuard;
    }

    public record PermissionDto(String code, String description) {}

    public enum RoleSource { BUILT_IN, SCHOOL, HEAD_OFFICE }

    public record RoleDto(String name, String description, List<String> permissions, RoleSource source, boolean editable) {}

    public record UpdateRolePermissionsRequest(List<String> permissions) {}

    public record CreateRoleRequest(String name, String description, Long headOfficeId, List<String> permissions) {}

    @GetMapping("/editable-roles")
    public List<String> editableRoles() {
        CurrentUser user = CurrentUserHolder.get();
        return editableRolesFor(user).stream().sorted().toList();
    }

    @GetMapping("/permissions")
    public List<PermissionDto> listPermissions() {
        CurrentUser user = CurrentUserHolder.get();
        List<PermissionDto> all = jdbcTemplate.query(
                "SELECT code, description FROM permissions ORDER BY code",
                (rs, rowNum) -> new PermissionDto(rs.getString("code"), rs.getString("description"))
        );
        if (user == null) return List.of();

        return all.stream()
                .filter(p -> p != null && p.code() != null)
                .filter(p -> {
                    String code = p.code().trim().toUpperCase();
                    if (user.isSuperAdmin()) return true;

                    if (PERM_HEAD_OFFICE_MANAGE.equals(code)) return false;
                    if (user.isSchoolScoped()) {
                        return !code.startsWith("HEAD_OFFICE_");
                    }
                    if (user.isHeadOfficeScopedAdmin()) {
                        if (!code.startsWith("HEAD_OFFICE_")) return true;
                        return PERM_HEAD_OFFICE_SCHOOL_MANAGE.equals(code);
                    }
                    // SUPER_ADMIN (and others with global scope) can see all except HEAD_OFFICE_MANAGE
                    return true;
                })
                .toList();
    }

    @GetMapping("/roles")
    public List<RoleDto> listRoles(@RequestParam(required = false) Long schoolId, @RequestParam(required = false) Long headOfficeId) {
        CurrentUser user = CurrentUserHolder.get();
        Long effectiveSchoolId;
        if (user != null && user.isSuperAdmin() && schoolId == null) {
            if (headOfficeId == null) throw new BadRequestException("headOfficeId is required");
            effectiveSchoolId = anySchoolIdForHeadOffice(headOfficeId);
        } else {
            effectiveSchoolId = schoolGuard.schoolIdForRead(user, schoolId);
        }
        if (effectiveSchoolId == null) throw new BadRequestException("schoolId is required");

        Set<String> editableBuiltIns = editableRolesFor(user);

        List<RoleDto> result = new ArrayList<>();
        for (String role : editableBuiltIns) {
            Set<String> perms = rbacService.permissionsFor(role, effectiveSchoolId);
            String desc = roleDescription(role);
            result.add(new RoleDto(role, desc, perms.stream().sorted().toList(), RoleSource.BUILT_IN, true));
        }

        // school custom roles
        List<Map<String, Object>> customRoles = jdbcTemplate.queryForList(
                "SELECT name, description, source FROM school_custom_roles WHERE school_id = ? ORDER BY name",
                effectiveSchoolId
        );
        for (Map<String, Object> row : customRoles) {
            String name = row.get("name") == null ? null : String.valueOf(row.get("name"));
            if (name == null || name.isBlank()) continue;
            String normalized = normalizeRole(name);
            if (normalized == null) continue;

            String description = row.get("description") == null ? null : String.valueOf(row.get("description"));
            String sourceRaw = row.get("source") == null ? null : String.valueOf(row.get("source"));
            RoleSource source = "HEAD_OFFICE".equalsIgnoreCase(sourceRaw) ? RoleSource.HEAD_OFFICE : RoleSource.SCHOOL;
            boolean editable = source == RoleSource.SCHOOL;
            if (source == RoleSource.HEAD_OFFICE) {
                editable = user != null && !user.isSchoolScoped();
            }

            Set<String> perms = Set.copyOf(
                    jdbcTemplate.queryForList(
                            "SELECT permission_code FROM school_custom_role_permissions WHERE school_id = ? AND role = ?",
                            String.class,
                            effectiveSchoolId,
                            normalized
                    )
            );
            result.add(new RoleDto(normalized, description, perms.stream().sorted().toList(), source, editable));
        }

        return result.stream()
                .filter(r -> r != null && r.name() != null)
                .sorted((a, b) -> String.valueOf(a.name()).compareToIgnoreCase(String.valueOf(b.name())))
                .toList();
    }

    @PostMapping("/roles")
    @Transactional
    public ResponseEntity<?> createRole(
            @RequestParam(required = false) Long schoolId,
            @RequestBody CreateRoleRequest req
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        String role = req == null ? null : normalizeRole(req.name());
        if (role == null || !ROLE_NAME.matcher(role).matches()) {
            throw new BadRequestException("Invalid role name");
        }
        if ("SUPER_ADMIN".equals(role)) throw new BadRequestException("SUPER_ADMIN cannot be created");

        // Prevent shadowing core roles.
        if (jdbcTemplate.queryForObject("SELECT COUNT(1) FROM roles WHERE upper(name) = upper(?)", Integer.class, role) > 0) {
            throw new BadRequestException("Role name is reserved");
        }

        List<String> perms = req == null || req.permissions() == null ? List.of() : req.permissions();
        List<String> normalizedPerms = normalizeAndValidatePerms(user, perms);

        String description = req == null ? null : normalizeDescription(req.description());

        if (user.isSchoolScopedAdminUser()) {
            Long effectiveSchoolId = schoolGuard.schoolIdForWrite(user, schoolId);
            if (effectiveSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureRoleDoesNotExistInSchool(effectiveSchoolId, role);
            upsertSchoolRole(effectiveSchoolId, role, description, "SCHOOL", user.headOfficeId(), normalizedPerms);
            return ResponseEntity.ok(Map.of("ok", true));
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long headOfficeId = user.headOfficeId();
            if (headOfficeId == null) throw new ForbiddenException();
            upsertHeadOfficeTemplateAndPropagate(headOfficeId, role, description, normalizedPerms);
            return ResponseEntity.ok(Map.of("ok", true));
        }

        if (user.isSuperAdmin()) {
            Long headOfficeId = req == null ? null : req.headOfficeId();
            if (headOfficeId == null) throw new BadRequestException("headOfficeId is required");
            upsertHeadOfficeTemplateAndPropagate(headOfficeId, role, description, normalizedPerms);
            return ResponseEntity.ok(Map.of("ok", true));
        }

        throw new ForbiddenException();
    }

    @PutMapping("/roles/{role}/permissions")
    @Transactional
    public ResponseEntity<?> replaceRolePermissions(
            @PathVariable String role,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long headOfficeId,
            @RequestBody UpdateRolePermissionsRequest req
    ) {
        String normalizedRole = normalizeRole(role);
        if (normalizedRole == null || !ROLE_NAME.matcher(normalizedRole).matches()) {
            throw new BadRequestException("Invalid role name");
        }

        CurrentUser user = CurrentUserHolder.get();
        String selfRole = normalizeRole(user == null ? null : user.role());
        if (selfRole != null && selfRole.equals(normalizedRole)) {
            throw new BadRequestException("Cannot edit your own role");
        }

        boolean isBuiltIn = editableRolesFor(user).contains(normalizedRole);

        Long effectiveSchoolId;
        if (user != null && user.isSuperAdmin() && schoolId == null) {
            if (headOfficeId == null) throw new BadRequestException("headOfficeId is required");
            effectiveSchoolId = anySchoolIdForHeadOffice(headOfficeId);
        } else {
            effectiveSchoolId = schoolGuard.schoolIdForWrite(user, schoolId);
        }
        if (effectiveSchoolId == null) throw new BadRequestException("schoolId is required");

        List<String> perms = req == null || req.permissions() == null ? List.of() : req.permissions();
        if ("SCHOOL_ADMIN".equals(normalizedRole) && (perms == null || !perms.contains("SCHOOL_RBAC_MANAGE"))) {
            // Prevent locking out school admins from managing school RBAC.
            perms = new ArrayList<>(perms == null ? List.of() : perms);
            perms.add("SCHOOL_RBAC_MANAGE");
        }

        List<String> normalizedPerms = normalizeAndValidatePerms(user, perms);

        try {
            if (isBuiltIn) {
                jdbcTemplate.update(
                        "DELETE FROM school_role_permissions WHERE school_id = ? AND role = ?",
                        effectiveSchoolId,
                        normalizedRole
                );
                for (String code : normalizedPerms) {
                    jdbcTemplate.update(
                            "INSERT INTO school_role_permissions(school_id, role, permission_code) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                            effectiveSchoolId,
                            normalizedRole,
                            code
                    );
                }
            } else {
                RoleSource existingSource = existingSchoolCustomRoleSource(effectiveSchoolId, normalizedRole);
                if (existingSource == null) throw new NotFoundException("Role not found");

                if (existingSource == RoleSource.HEAD_OFFICE) {
                    if (user == null || user.isSchoolScoped()) {
                        throw new ForbiddenException();
                    }

                    Long roleHeadOfficeId = roleHeadOfficeIdForSchoolRole(effectiveSchoolId, normalizedRole);
                    if (roleHeadOfficeId == null) throw new BadRequestException("Role is missing head office linkage");
                    if (user.isHeadOfficeScopedAdmin() && !Objects.equals(user.headOfficeId(), roleHeadOfficeId)) {
                        throw new ForbiddenException();
                    }

                    // Update template + propagate to all school copies
                    upsertHeadOfficeTemplateAndPropagate(roleHeadOfficeId, normalizedRole, roleDescriptionForSchoolRole(effectiveSchoolId, normalizedRole), normalizedPerms);
                } else {
                    // SCHOOL custom role
                    if (user == null) throw new ForbiddenException();
                    // school admin can edit only inside their school
                    if (user.isSchoolScopedAdminUser() && !Objects.equals(user.schoolId(), effectiveSchoolId)) {
                        throw new ForbiddenException();
                    }
                    jdbcTemplate.update(
                            "DELETE FROM school_custom_role_permissions WHERE school_id = ? AND role = ?",
                            effectiveSchoolId,
                            normalizedRole
                    );
                    for (String code : normalizedPerms) {
                        jdbcTemplate.update(
                                "INSERT INTO school_custom_role_permissions(school_id, role, permission_code) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                                effectiveSchoolId,
                                normalizedRole,
                                code
                        );
                    }
                    jdbcTemplate.update(
                            "UPDATE school_custom_roles SET updated_at = CURRENT_TIMESTAMP WHERE school_id = ? AND name = ?",
                            effectiveSchoolId,
                            normalizedRole
                    );
                }
            }
        } catch (DataIntegrityViolationException e) {
            throw new BadRequestException("Invalid permission code");
        }

        rbacService.evict(normalizedRole, effectiveSchoolId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @DeleteMapping("/roles/{role}")
    @Transactional
    public ResponseEntity<?> deleteRole(
            @PathVariable String role,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long headOfficeId
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        String normalizedRole = normalizeRole(role);
        if (normalizedRole == null || !ROLE_NAME.matcher(normalizedRole).matches()) throw new BadRequestException("Invalid role name");

        // Cannot delete built-in role names
        if (jdbcTemplate.queryForObject("SELECT COUNT(1) FROM roles WHERE upper(name) = upper(?)", Integer.class, normalizedRole) > 0) {
            throw new BadRequestException("Role name is reserved");
        }

        if (user.isSchoolScopedAdminUser()) {
            Long effectiveSchoolId = schoolGuard.schoolIdForWrite(user, schoolId);
            if (effectiveSchoolId == null) throw new BadRequestException("schoolId is required");

            RoleSource source = existingSchoolCustomRoleSource(effectiveSchoolId, normalizedRole);
            if (source == null) throw new NotFoundException("Role not found");
            if (source == RoleSource.HEAD_OFFICE) throw new ForbiddenException();

            deleteSchoolCustomRole(effectiveSchoolId, normalizedRole);
            fallbackTeachersInSchool(effectiveSchoolId, normalizedRole);
            rbacService.evict(normalizedRole, effectiveSchoolId);
            return ResponseEntity.ok(Map.of("ok", true));
        }

        // head-office scoped admin or super-admin can delete head-office templates
        Long effectiveHeadOfficeId = null;
        if (user.isHeadOfficeScopedAdmin()) {
            effectiveHeadOfficeId = user.headOfficeId();
        } else if (user.isSuperAdmin()) {
            effectiveHeadOfficeId = headOfficeId;
        }
        if (effectiveHeadOfficeId == null) throw new BadRequestException("headOfficeId is required");

        if (user.isHeadOfficeScopedAdmin() && !Objects.equals(user.headOfficeId(), effectiveHeadOfficeId)) throw new ForbiddenException();

        // Delete template
        jdbcTemplate.update("DELETE FROM head_office_custom_role_permissions WHERE head_office_id = ? AND role = ?", effectiveHeadOfficeId, normalizedRole);
        jdbcTemplate.update("DELETE FROM head_office_custom_roles WHERE head_office_id = ? AND name = ?", effectiveHeadOfficeId, normalizedRole);

        // Delete all school copies + fallback teachers
        List<Long> schoolIds = jdbcTemplate.queryForList(
                "SELECT id FROM schools WHERE head_office_id = ? AND (is_deleted IS NULL OR is_deleted = false)",
                Long.class,
                effectiveHeadOfficeId
        );
        for (Long sid : schoolIds) {
            if (sid == null) continue;
            deleteSchoolCustomRole(sid, normalizedRole);
            fallbackTeachersInSchool(sid, normalizedRole);
            rbacService.evict(normalizedRole, sid);
        }

        return ResponseEntity.ok(Map.of("ok", true));
    }

    private Set<String> editableRolesFor(CurrentUser user) {
        if (user == null) return Set.of();

        if (user.isSuperAdmin()) {
            return Set.of("ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT");
        }
        if (user.isHeadOfficeScopedAdmin()) {
            return Set.of("SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT");
        }
        if (user.isRole("SCHOOL_ADMIN")) {
            return Set.of("TEACHER", "STUDENT", "PARENT");
        }
        if (user.isRole("TEACHER")) {
            return Set.of("STUDENT", "PARENT");
        }
        return Set.of();
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

    private Long anySchoolIdForHeadOffice(Long headOfficeId) {
        List<Long> ids = jdbcTemplate.queryForList(
                "SELECT id FROM schools WHERE head_office_id = ? AND (is_deleted IS NULL OR is_deleted = false) ORDER BY id ASC LIMIT 1",
                Long.class,
                headOfficeId
        );
        if (ids == null || ids.isEmpty() || ids.get(0) == null) {
            throw new BadRequestException("No schools found under head office");
        }
        return ids.get(0);
    }

    private List<String> normalizeAndValidatePerms(CurrentUser user, List<String> perms) {
        List<String> out = new ArrayList<>();
        if (perms == null) return out;

        Set<String> seen = new HashSet<>();
        for (String p : perms) {
            String code = normalizePermission(p);
            if (code == null) continue;

            // HEAD_OFFICE_MANAGE is SUPER_ADMIN-only.
            if (PERM_HEAD_OFFICE_MANAGE.equals(code) && (user == null || !user.isSuperAdmin())) {
                throw new BadRequestException("Cannot grant permission: " + code);
            }

            // School-scoped users can never grant head-office permissions
            if (user != null && user.isSchoolScoped() && code.startsWith("HEAD_OFFICE_")) {
                throw new BadRequestException("Cannot grant permission: " + code);
            }

            // Head-office scoped admins can only grant HEAD_OFFICE_SCHOOL_MANAGE among head-office permissions.
            if (user != null && user.isHeadOfficeScopedAdmin() && code.startsWith("HEAD_OFFICE_") && !PERM_HEAD_OFFICE_SCHOOL_MANAGE.equals(code)) {
                throw new BadRequestException("Cannot grant permission: " + code);
            }

            if (user == null || !user.hasPermission(code)) {
                throw new BadRequestException("Cannot grant permission you do not own: " + code);
            }
            if (seen.add(code)) out.add(code);
        }
        return out;
    }

    private String roleDescription(String roleName) {
        if (roleName == null) return null;
        return jdbcTemplate.query(
                "SELECT description FROM roles WHERE upper(name) = upper(?)",
                (rs, rowNum) -> rs.getString("description"),
                roleName
        ).stream().findFirst().orElse(null);
    }

    private RoleSource existingSchoolCustomRoleSource(Long schoolId, String roleName) {
        if (schoolId == null || roleName == null) return null;
        List<String> rows = jdbcTemplate.queryForList(
                "SELECT source FROM school_custom_roles WHERE school_id = ? AND upper(name) = upper(?)",
                String.class,
                schoolId,
                roleName
        );
        if (rows.isEmpty()) return null;
        String raw = rows.get(0);
        if ("HEAD_OFFICE".equalsIgnoreCase(raw)) return RoleSource.HEAD_OFFICE;
        return RoleSource.SCHOOL;
    }

    private Long roleHeadOfficeIdForSchoolRole(Long schoolId, String roleName) {
        return jdbcTemplate.query(
                "SELECT head_office_id FROM school_custom_roles WHERE school_id = ? AND upper(name) = upper(?)",
                (rs, rowNum) -> {
                    long v = rs.getLong("head_office_id");
                    return rs.wasNull() ? null : v;
                },
                schoolId,
                roleName
        ).stream().findFirst().orElse(null);
    }

    private String roleDescriptionForSchoolRole(Long schoolId, String roleName) {
        return jdbcTemplate.query(
                "SELECT description FROM school_custom_roles WHERE school_id = ? AND upper(name) = upper(?)",
                (rs, rowNum) -> rs.getString("description"),
                schoolId,
                roleName
        ).stream().findFirst().orElse(null);
    }

    private void ensureRoleDoesNotExistInSchool(Long schoolId, String roleName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM school_custom_roles WHERE school_id = ? AND upper(name) = upper(?)",
                Integer.class,
                schoolId,
                roleName
        );
        if (count != null && count > 0) throw new BadRequestException("Role already exists in this school");
    }

    private void upsertSchoolRole(Long schoolId, String roleName, String description, String source, Long headOfficeId, List<String> perms) {
        jdbcTemplate.update(
                "INSERT INTO school_custom_roles(school_id, name, description, source, head_office_id) VALUES (?, ?, ?, ?, ?) " +
                        "ON CONFLICT (school_id, name) DO UPDATE SET description = EXCLUDED.description, source = EXCLUDED.source, head_office_id = EXCLUDED.head_office_id, updated_at = CURRENT_TIMESTAMP",
                schoolId,
                roleName,
                description,
                source,
                headOfficeId
        );
        jdbcTemplate.update("DELETE FROM school_custom_role_permissions WHERE school_id = ? AND role = ?", schoolId, roleName);
        for (String code : perms) {
            jdbcTemplate.update(
                    "INSERT INTO school_custom_role_permissions(school_id, role, permission_code) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                    schoolId,
                    roleName,
                    code
            );
        }
    }

    private void upsertHeadOfficeTemplateAndPropagate(Long headOfficeId, String roleName, String description, List<String> perms) {
        jdbcTemplate.update(
                "INSERT INTO head_office_custom_roles(head_office_id, name, description) VALUES (?, ?, ?) " +
                        "ON CONFLICT (head_office_id, name) DO UPDATE SET description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP",
                headOfficeId,
                roleName,
                description
        );
        jdbcTemplate.update("DELETE FROM head_office_custom_role_permissions WHERE head_office_id = ? AND role = ?", headOfficeId, roleName);
        for (String code : perms) {
            jdbcTemplate.update(
                    "INSERT INTO head_office_custom_role_permissions(head_office_id, role, permission_code) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                    headOfficeId,
                    roleName,
                    code
            );
        }

        List<Long> schoolIds = jdbcTemplate.queryForList(
                "SELECT id FROM schools WHERE head_office_id = ? AND (is_deleted IS NULL OR is_deleted = false)",
                Long.class,
                headOfficeId
        );
        for (Long sid : schoolIds) {
            if (sid == null) continue;
            upsertSchoolRole(sid, roleName, description, "HEAD_OFFICE", headOfficeId, perms);
            rbacService.evict(roleName, sid);
        }
    }

    private void deleteSchoolCustomRole(Long schoolId, String roleName) {
        jdbcTemplate.update("DELETE FROM school_custom_role_permissions WHERE school_id = ? AND role = ?", schoolId, roleName);
        jdbcTemplate.update("DELETE FROM school_custom_roles WHERE school_id = ? AND name = ?", schoolId, roleName);
    }

    private void fallbackTeachersInSchool(Long schoolId, String roleName) {
        if (schoolId == null || roleName == null) return;
        // teachers table stores free-text role; reset to Teacher for any matching role name variants.
        jdbcTemplate.update(
                "UPDATE teachers SET role = 'Teacher' WHERE school_id = ? AND upper(replace(replace(role, '-', '_'), ' ', '_')) = ?",
                schoolId,
                roleName
        );
    }
}
