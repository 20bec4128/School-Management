package com.School.School_management.livekit;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class LiveKitTokenService {

    private final LiveKitProperties props;

    public LiveKitTokenService(LiveKitProperties props) {
        this.props = props;
    }

    public String createTeacherToken(String identity, String name, String roomName) {
        Map<String, Object> videoGrant = new LinkedHashMap<>();
        videoGrant.put("room", roomName);
        videoGrant.put("roomJoin", true);
        videoGrant.put("canSubscribe", true);
        videoGrant.put("canPublish", true);
        videoGrant.put("canPublishData", true);
        videoGrant.put("canPublishSources", List.of("camera", "microphone", "screen_share"));
        return createToken(identity, name, videoGrant, defaultTtl());
    }

    public String createStudentToken(String identity, String name, String roomName, boolean canPublish) {
        Map<String, Object> videoGrant = new LinkedHashMap<>();
        videoGrant.put("room", roomName);
        videoGrant.put("roomJoin", true);
        videoGrant.put("canSubscribe", true);
        videoGrant.put("canPublish", canPublish);
        videoGrant.put("canPublishData", true);
        return createToken(identity, name, videoGrant, defaultTtl());
    }

    public String createViewerToken(String identity, String name, String roomName) {
        Map<String, Object> videoGrant = new LinkedHashMap<>();
        videoGrant.put("room", roomName);
        videoGrant.put("roomJoin", true);
        videoGrant.put("canSubscribe", true);
        videoGrant.put("canPublish", false);
        videoGrant.put("canPublishData", true);
        return createToken(identity, name, videoGrant, defaultTtl());
    }

    private Duration defaultTtl() {
        int minutes = props.tokenTtlMinutes() == null ? 180 : props.tokenTtlMinutes();
        if (minutes < 5) minutes = 5;
        if (minutes > 24 * 60) minutes = 24 * 60;
        return Duration.ofMinutes(minutes);
    }

    private String createToken(String identity, String name, Map<String, Object> videoGrant, Duration ttl) {
        if (props.apiKey() == null || props.apiKey().isBlank()) {
            throw new IllegalStateException("LiveKit apiKey is not configured (app.livekit.apiKey)");
        }
        if (props.apiSecret() == null || props.apiSecret().isBlank()) {
            throw new IllegalStateException("LiveKit apiSecret is not configured (app.livekit.apiSecret)");
        }
        SecretKey key = Keys.hmacShaKeyFor(props.apiSecret().getBytes(StandardCharsets.UTF_8));

        Instant now = Instant.now();
        Instant exp = now.plus(ttl == null ? Duration.ofHours(3) : ttl);

        return Jwts.builder()
                .issuer(props.apiKey())
                .subject(identity)
                .claim("name", name)
                .claim("video", videoGrant)
                .issuedAt(java.util.Date.from(now))
                .notBefore(java.util.Date.from(now.minusSeconds(5)))
                .expiration(java.util.Date.from(exp))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }
}

