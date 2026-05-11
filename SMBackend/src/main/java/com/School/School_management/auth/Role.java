package com.School.School_management.auth;

public enum Role {
    SUPER_ADMIN,
    ADMIN,
    SCHOOL_ADMIN,
    TEACHER,
    STUDENT,
    PARENT;

    public static Role from(String value) {
        if (value == null) return null;
        return Role.valueOf(value.trim().toUpperCase());
    }
}
