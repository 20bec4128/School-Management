package com.School.School_management.auth;

import java.util.Map;

public final class PagePermissionSlugAliases {

    private static final Map<String, String> TO_STORED = Map.ofEntries(
            Map.entry("school", "manage-school"),
            Map.entry("teacher", "manage-teacher"),
            Map.entry("award", "manage-award"),
            Map.entry("designation", "manage-designation"),
            Map.entry("employee", "manage-employee"),
            Map.entry("feedback", "manage-feedback"),
            Map.entry("subscription-plan", "subscription-plans"),
            Map.entry("online-exam", "onlineexam")
    );

    private PagePermissionSlugAliases() {
    }

    public static String toStoredSlug(String slug) {
        if (slug == null) return null;
        String trimmed = slug.trim();
        if (trimmed.isEmpty()) return trimmed;
        return TO_STORED.getOrDefault(trimmed, trimmed);
    }
}
