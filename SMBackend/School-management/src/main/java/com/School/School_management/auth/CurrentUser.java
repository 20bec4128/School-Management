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
    public boolean hasPermission(String permission) {
        if (permission == null || permission.isBlank()) return true;
        if (isRole("SUPER_ADMIN")) return true;
        if (permissions != null && permissions.contains("*")) return true;
        return permissions != null && permissions.contains(permission);
    }

    public boolean isRole(String expected) {
        if (expected == null) return false;
        if (role == null) return false;
        return role.trim().equalsIgnoreCase(expected.trim());
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
