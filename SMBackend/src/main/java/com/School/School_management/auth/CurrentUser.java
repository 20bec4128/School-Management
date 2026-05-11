package com.School.School_management.auth;

import java.util.Set;

public record CurrentUser(
        String username,
        String role,
        Long adminId,
        Long headOfficeId,
        Long schoolId,
        Long teacherId,
        Long studentId,
        Long parentId,
        Set<String> permissions
) {
    private static String normalizeRoleName(String value) {
        if (value == null) return null;
        String trimmed = value.trim().toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');
        trimmed = trimmed.replaceAll("_+", "_");
        trimmed = trimmed.replaceAll("^_+|_+$", "");
        if ("SUPERADMIN".equals(trimmed)) trimmed = "SUPER_ADMIN";
        if ("HEADOFFICEADMIN".equals(trimmed) || "HEAD_OFFICEADMIN".equals(trimmed)) trimmed = "HEAD_OFFICE_ADMIN";
        if ("SCHOOLADMIN".equals(trimmed)) trimmed = "SCHOOL_ADMIN";
        return trimmed.isEmpty() ? null : trimmed;
    }

    public boolean hasPermission(String permission) {
        if (permission == null || permission.isBlank()) return true;
        if (isRole("SUPER_ADMIN")) return true;
        if (permissions != null && permissions.contains("*")) return true;
        return permissions != null && permissions.contains(permission);
    }

    public boolean isRole(String expected) {
        String e = normalizeRoleName(expected);
        String r = normalizeRoleName(role);
        if (e == null || r == null) return false;
        return r.equals(e);
    }

    public boolean isSuperAdmin() {
        return isRole("SUPER_ADMIN");
    }

    public boolean isAdmin() {
        return isRole("ADMIN");
    }

    public boolean isGlobalAdmin() {
        return isSuperAdmin();
    }

    public boolean isHeadOfficeScopedAdmin() {
        return isAdmin() && headOfficeId != null && schoolId == null;
    }

    public boolean isSchoolScoped() {
        return isRole("SCHOOL_ADMIN") || isRole("TEACHER") || isRole("STUDENT") || isRole("PARENT");
    }

    public boolean isSchoolScopedAdminUser() {
        return isRole("SCHOOL_ADMIN") && adminId != null && schoolId != null;
    }
}
