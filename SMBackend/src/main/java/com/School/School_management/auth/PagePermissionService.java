package com.School.School_management.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PagePermissionService {

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final JdbcTemplate jdbcTemplate;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public PagePermissionService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean hasPagePermission(String role, Long schoolId, String slug, String action) {
        if (role == null || slug == null || action == null) return false;
        String normalizedRole = normalizeRole(role);
        if (normalizedRole == null) return false;
        if ("SUPER_ADMIN".equals(normalizedRole)) return true;
        String storedSlug = PagePermissionSlugAliases.toStoredSlug(slug);

        String key = String.format("%s:%s:%s", normalizedRole, schoolId == null ? "-" : schoolId, storedSlug);
        CacheEntry cached = cache.get(key);
        if (cached != null && !cached.isExpired()) {
            return cached.hasAction(action);
        }

        Boolean hasAccess = false;
        String column;
        switch (action.toLowerCase()) {
            case "view":
                column = "can_view";
                break;
            case "add":
                column = "can_add";
                break;
            case "edit":
                column = "can_edit";
                break;
            case "delete":
                column = "can_delete";
                break;
            default:
                return false;
        }

        try {
            if (schoolId != null) {
                String sql = String.format(
                        "SELECT COALESCE(school.%s, global.%s, false) " +
                        "FROM rbac_functions rf " +
                        "LEFT JOIN rbac_role_page_permissions school " +
                        "  ON school.function_id = rf.id AND school.role_name = ? AND school.school_id = ? " +
                        "LEFT JOIN rbac_role_page_permissions global " +
                        "  ON global.function_id = rf.id AND global.role_name = ? AND global.school_id IS NULL " +
                        "WHERE rf.slug = ?", column, column);
                hasAccess = jdbcTemplate.queryForObject(sql, Boolean.class, normalizedRole, schoolId, normalizedRole, storedSlug);
            } else {
                String sql = String.format(
                        "SELECT COALESCE(global.%s, false) " +
                        "FROM rbac_functions rf " +
                        "LEFT JOIN rbac_role_page_permissions global " +
                        "  ON global.function_id = rf.id AND global.role_name = ? AND global.school_id IS NULL " +
                        "WHERE rf.slug = ?", column);
                hasAccess = jdbcTemplate.queryForObject(sql, Boolean.class, normalizedRole, storedSlug);
            }
        } catch (Exception e) {
            // Under default-deny, if query fails or no row found, return false
            hasAccess = false;
        }

        boolean finalAccess = hasAccess != null && hasAccess;
        // Since we cache per role:school:slug, we can fetch all 4 permissions or just store this action.
        // To keep it simple, we cache all 4 permissions for the slug. Let's load the full permission record.
        PermissionsRecord record = fetchPermissionsRecord(normalizedRole, schoolId, storedSlug);
        cache.put(key, new CacheEntry(record, Instant.now().plus(CACHE_TTL)));

        return record.hasAction(action);
    }

    private PermissionsRecord fetchPermissionsRecord(String role, Long schoolId, String slug) {
        try {
            if (schoolId != null) {
                return jdbcTemplate.queryForObject(
                        "SELECT " +
                        "  COALESCE(school.can_view, global.can_view, false) AS can_view, " +
                        "  COALESCE(school.can_add, global.can_add, false) AS can_add, " +
                        "  COALESCE(school.can_edit, global.can_edit, false) AS can_edit, " +
                        "  COALESCE(school.can_delete, global.can_delete, false) AS can_delete " +
                        "FROM rbac_functions rf " +
                        "LEFT JOIN rbac_role_page_permissions school " +
                        "  ON school.function_id = rf.id AND school.role_name = ? AND school.school_id = ? " +
                        "LEFT JOIN rbac_role_page_permissions global " +
                        "  ON global.function_id = rf.id AND global.role_name = ? AND global.school_id IS NULL " +
                        "WHERE rf.slug = ?",
                        (rs, rowNum) -> new PermissionsRecord(
                                rs.getBoolean("can_view"),
                                rs.getBoolean("can_add"),
                                rs.getBoolean("can_edit"),
                                rs.getBoolean("can_delete")
                        ),
                        role, schoolId, role, slug
                );
            } else {
                return jdbcTemplate.queryForObject(
                        "SELECT " +
                        "  COALESCE(global.can_view, false) AS can_view, " +
                        "  COALESCE(global.can_add, false) AS can_add, " +
                        "  COALESCE(global.can_edit, false) AS can_edit, " +
                        "  COALESCE(global.can_delete, false) AS can_delete " +
                        "FROM rbac_functions rf " +
                        "LEFT JOIN rbac_role_page_permissions global " +
                        "  ON global.function_id = rf.id AND global.role_name = ? AND global.school_id IS NULL " +
                        "WHERE rf.slug = ?",
                        (rs, rowNum) -> new PermissionsRecord(
                                rs.getBoolean("can_view"),
                                rs.getBoolean("can_add"),
                                rs.getBoolean("can_edit"),
                                rs.getBoolean("can_delete")
                        ),
                        role, slug
                );
            }
        } catch (Exception e) {
            return new PermissionsRecord(false, false, false, false);
        }
    }

    public void evict(String role, Long schoolId, String slug) {
        String normalized = normalizeRole(role);
        if (normalized == null) return;
        String key = String.format("%s:%s:%s", normalized, schoolId == null ? "-" : schoolId, PagePermissionSlugAliases.toStoredSlug(slug));
        cache.remove(key);
    }

    public void evictAll() {
        cache.clear();
    }

    private String normalizeRole(String role) {
        if (role == null) return null;
        String trimmed = role.trim();
        if (trimmed.isEmpty()) return null;
        String normalized = trimmed.toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');
        normalized = normalized.replaceAll("_+", "_");
        normalized = normalized.replaceAll("^_+|_+$", "");
        return normalized.isEmpty() ? null : normalized;
    }

    private record PermissionsRecord(boolean view, boolean add, boolean edit, boolean delete) {
        boolean hasAction(String action) {
            switch (action.toLowerCase()) {
                case "view": return view;
                case "add": return add;
                case "edit": return edit;
                case "delete": return delete;
                default: return false;
            }
        }
    }

    private record CacheEntry(PermissionsRecord permissions, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }

        boolean hasAction(String action) {
            return permissions.hasAction(action);
        }
    }
}
