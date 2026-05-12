package com.School.School_management.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class RbacService {

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final JdbcTemplate jdbcTemplate;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public RbacService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Set<String> permissionsFor(String role) {
        return permissionsFor(role, null);
    }

    public Set<String> permissionsFor(String role, Long schoolId) {
        String normalized = normalizeRole(role);
        if (normalized == null) return Set.of();
        if ("SUPER_ADMIN".equals(normalized)) return Set.of("*");

        String key = normalized + ":" + (schoolId == null ? "-" : String.valueOf(schoolId));
        CacheEntry cached = cache.get(key);
        if (cached != null && !cached.isExpired()) return cached.permissions();

        Set<String> perms;
        if (schoolId != null && hasSchoolOverride(schoolId, normalized)) {
            perms = Set.copyOf(
                    jdbcTemplate.queryForList(
                            "SELECT permission_code FROM school_role_permissions WHERE school_id = ? AND role = ?",
                            String.class,
                            schoolId,
                            normalized
                    )
            );
        } else if (schoolId != null && hasSchoolCustomRole(schoolId, normalized)) {
            perms = Set.copyOf(
                    jdbcTemplate.queryForList(
                            "SELECT permission_code FROM school_custom_role_permissions WHERE school_id = ? AND role = ?",
                            String.class,
                            schoolId,
                            normalized
                    )
            );
        } else {
            perms = Set.copyOf(
                    jdbcTemplate.queryForList(
                            "SELECT permission_code FROM role_permissions WHERE role = ?",
                            String.class,
                            normalized
                    )
            );
        }
        cache.put(key, new CacheEntry(perms, Instant.now().plus(CACHE_TTL)));
        return perms;
    }

    public void evict(String role) {
        evict(role, null);
    }

    public void evict(String role, Long schoolId) {
        String normalized = normalizeRole(role);
        if (normalized == null) return;
        String key = normalized + ":" + (schoolId == null ? "-" : String.valueOf(schoolId));
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

    private boolean hasSchoolOverride(Long schoolId, String role) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM school_role_permissions WHERE school_id = ? AND role = ?",
                Integer.class,
                schoolId,
                role
        );
        return count != null && count > 0;
    }

    private boolean hasSchoolCustomRole(Long schoolId, String role) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM school_custom_roles WHERE school_id = ? AND name = ?",
                Integer.class,
                schoolId,
                role
        );
        return count != null && count > 0;
    }

    private record CacheEntry(Set<String> permissions, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}
