package com.School.School_management.livekit;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.livekit")
public record LiveKitProperties(
        String apiKey,
        String apiSecret,
        String wsUrl,
        Integer tokenTtlMinutes
) {
}

