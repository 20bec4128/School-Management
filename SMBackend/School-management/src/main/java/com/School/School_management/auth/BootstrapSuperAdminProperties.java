package com.School.School_management.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.bootstrap.superadmin")
public record BootstrapSuperAdminProperties(
        String username,
        String password
) {}

