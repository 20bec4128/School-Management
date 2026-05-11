package com.School.School_management.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtProperties props;
    private final SecretKey key;

    public JwtService(JwtProperties props) {
        this.props = props;
        String secret = props.secret();
        if (secret == null || secret.isBlank() || secret.length() < 32) {
            throw new IllegalStateException("app.jwt.secret must be set and at least 32 characters");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String issueToken(TokenClaims claims) {
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofMinutes(Math.max(1, props.ttlMinutes())));
        var builder = Jwts.builder()
                .issuer(props.issuer() == null ? "school-management" : props.issuer())
                .subject(claims.username())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claim("role", claims.role())
                .claim("adminId", claims.adminId())
                .claim("headOfficeId", claims.headOfficeId())
                .claim("schoolId", claims.schoolId())
                .claim("teacherId", claims.teacherId())
                .claim("studentId", claims.studentId())
                .claim("parentId", claims.parentId())
                .signWith(key);

        String permRole = claims.permRole();
        if (permRole != null && !permRole.isBlank()) {
            builder.claim("permRole", permRole);
        }

        return builder.compact();
    }

    public TokenClaims verify(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(props.issuer() == null ? "school-management" : props.issuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String username = claims.getSubject();
        String role = claims.get("role", String.class);
        Long adminId = getLong(claims, "adminId");
        Long headOfficeId = getLong(claims, "headOfficeId");
        Long schoolId = getLong(claims, "schoolId");
        Long teacherId = getLong(claims, "teacherId");
        Long studentId = getLong(claims, "studentId");
        Long parentId = getLong(claims, "parentId");
        String permRole = claims.get("permRole", String.class);
        return new TokenClaims(username, role, permRole, adminId, headOfficeId, schoolId, teacherId, studentId, parentId);
    }

    private Long getLong(Claims claims, String key) {
        Object raw = claims.get(key);
        if (raw == null) return null;
        if (raw instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(raw));
        } catch (Exception e) {
            return null;
        }
    }

    public record TokenClaims(
            String username,
            String role,
            String permRole,
            Long adminId,
            Long headOfficeId,
            Long schoolId,
            Long teacherId,
            Long studentId,
            Long parentId
    ) {}
}
