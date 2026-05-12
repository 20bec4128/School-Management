package com.School.School_management.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.admin")
public record AuthProperties(
        String username,
        String password
) {}

