package com.School.School_management.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.SchoolRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtAuthInterceptor implements HandlerInterceptor {

    public static final String ATTR_USER = "authUser";

    private final JwtService jwtService;
    private final RbacService rbacService;
    private final ObjectMapper objectMapper;
    private final HeadOfficeRepository headOfficeRepository;
    private final SchoolRepository schoolRepository;

    public JwtAuthInterceptor(
            JwtService jwtService,
            RbacService rbacService,
            ObjectMapper objectMapper,
            HeadOfficeRepository headOfficeRepository,
            SchoolRepository schoolRepository
    ) {
        this.jwtService = jwtService;
        this.rbacService = rbacService;
        this.objectMapper = objectMapper;
        this.headOfficeRepository = headOfficeRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) return true;
        if (path.startsWith("/api/auth/")) return true;

        String token = readBearer(request);
        if (token == null) {
            writeError(response, 401, "Unauthorized");
            return false;
        }

        JwtService.TokenClaims claims;
        try {
            claims = jwtService.verify(token);
        } catch (Exception e) {
            writeError(response, 401, "Unauthorized");
            return false;
        }

        String roleName = claims.role() == null ? null : claims.role().trim().toUpperCase();
        if (roleName == null || roleName.isBlank()) {
            writeError(response, 401, "Unauthorized");
            return false;
        }

        String permRoleName = claims.permRole() == null ? null : claims.permRole().trim().toUpperCase();
        String effectivePermRole = (permRoleName != null && !permRoleName.isBlank()) ? permRoleName : roleName;

        Long headOfficeId = claims.headOfficeId();
        if (headOfficeId == null && claims.schoolId() != null) {
            headOfficeId = schoolRepository.findByIdAndIsDeletedFalse(claims.schoolId())
                    .map(s -> s.getHeadOfficeId())
                    .orElse(null);
        }

        Long permissionSchoolId = claims.schoolId();
        if (permissionSchoolId == null && headOfficeId != null) {
            // Head-office scoped users have no schoolId in token; use any school under the head office
            permissionSchoolId = schoolRepository
                    .findAllByIsDeletedFalseAndHeadOfficeId(
                            headOfficeId,
                            org.springframework.data.domain.PageRequest.of(0, 1, org.springframework.data.domain.Sort.by("id").ascending())
                    )
                    .stream()
                    .findFirst()
                    .map(s -> s.getId())
                    .orElse(null);
        }

        Set<String> permissions = rbacService.permissionsFor(effectivePermRole, permissionSchoolId);
        if (headOfficeId != null) {
            boolean inactive = headOfficeRepository.findById(headOfficeId)
                    .map(ho -> "INACTIVE".equalsIgnoreCase(ho.getStatus()))
                    .orElse(false);
            if (inactive) {
                writeError(response, 403, "Account disabled");
                return false;
            }
        }

        CurrentUser user = new CurrentUser(
                claims.username(),
                roleName,
                claims.adminId(),
                headOfficeId,
                claims.schoolId(),
                claims.teacherId(),
                claims.studentId(),
                claims.parentId(),
                permissions
        );

        request.setAttribute(ATTR_USER, user);
        CurrentUserHolder.set(user);

        String[] required = requiredPermissions(handler);
        if (required == null || required.length == 0) {
            // Default deny for safety: all /api/** routes must declare required permissions.
            writeError(response, 403, "Forbidden");
            return false;
        }
        boolean ok = false;
        for (String perm : required) {
            if (perm != null && !perm.isBlank() && user.hasPermission(perm)) {
                ok = true;
                break;
            }
        }
        if (!ok) {
            writeError(response, 403, "Forbidden");
            return false;
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        CurrentUserHolder.clear();
    }

    private String[] requiredPermissions(Object handler) {
        if (!(handler instanceof HandlerMethod hm)) return null;
        RequirePermission method = hm.getMethodAnnotation(RequirePermission.class);
        if (method != null) return normalize(method.value());
        RequirePermission type = hm.getBeanType().getAnnotation(RequirePermission.class);
        return type == null ? null : normalize(type.value());
    }

    private String[] normalize(String[] values) {
        if (values == null) return null;
        return java.util.Arrays.stream(values)
                .filter(v -> v != null && !v.trim().isEmpty())
                .map(v -> v.trim())
                .toArray(String[]::new);
    }

    private String readBearer(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null) return null;
        if (!auth.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())) return null;
        String token = auth.substring("Bearer ".length()).trim();
        return token.isEmpty() ? null : token;
    }

    private void writeError(HttpServletResponse response, int status, String message) throws Exception {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), Map.of("message", message));
    }
}
