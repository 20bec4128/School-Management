package com.School.School_management.auth;

import com.School.School_management.Entity.AdminUser;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Entity.Parent;
import com.School.School_management.Entity.Student;
import com.School.School_management.Repository.AdminUserRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.ParentRepository;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.TeacherRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthProperties authProperties;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RbacService rbacService;
    private final AdminUserRepository adminUserRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;

    public AuthController(
            AuthProperties authProperties,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RbacService rbacService,
            AdminUserRepository adminUserRepository,
            ParentRepository parentRepository,
            ParentStudentRepository parentStudentRepository,
            TeacherRepository teacherRepository,
            StudentRepository studentRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository
    ) {
        this.authProperties = authProperties;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rbacService = rbacService;
        this.adminUserRepository = adminUserRepository;
        this.parentRepository = parentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
    }

    public record LoginRequest(String username, String password) {}

    private static String normalizeRoleNameForPermissions(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) return null;
        String normalized = trimmed.toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');
        normalized = normalized.replaceAll("_+", "_");
        normalized = normalized.replaceAll("^_+|_+$", "");
        return normalized.isEmpty() ? null : normalized;
    }

    private static String normalizeRoleForInternal(String raw) {
        String normalized = normalizeRoleNameForPermissions(raw);
        if (normalized == null) return null;

        // Internal (backend) RBAC role names.
        if ("HEAD_OFFICE_ADMIN".equals(normalized)) return "ADMIN";
        if ("GUARDIAN".equals(normalized)) return "PARENT";
        return normalized;
    }

    private static String normalizeRoleForClient(String raw) {
        if (raw == null) return null;
        String r = raw.trim().toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');
        r = r.replaceAll("_+", "_");
        r = r.replaceAll("^_+|_+$", "");
        if (r.isEmpty()) return null;

        // Canonical names expected by the frontend.
        if ("ADMIN".equals(r)) return "HEAD_OFFICE_ADMIN";
        if ("GUARDIAN".equals(r)) return "PARENT";
        return r;
    }

    private static String homePageForClientRole(String clientRole, int childCount) {
        if (clientRole == null) return "dashboard";
        return switch (clientRole) {
            case "SUPER_ADMIN" -> "super-admin-dashboard";
            case "HEAD_OFFICE_ADMIN" -> "head-office-dashboard";
            case "SCHOOL_ADMIN" -> "school-admin-dashboard";
            case "TEACHER" -> "teacher-dashboard";
            case "STUDENT" -> "student-dashboard";
            case "PARENT" -> (childCount > 1 ? "parent-child-select" : "parent-dashboard");
            default -> "dashboard";
        };
    }

    private void putRoleContext(Map<String, Object> body, String roleUpper, String username) {
        if (roleUpper == null || roleUpper.isBlank() || username == null || username.isBlank()) return;

        if ("TEACHER".equals(roleUpper)) {
            teacherRepository.findByUsername(username).ifPresent((t) -> {
                body.put("userId", t.getId());
                body.put("teacherId", t.getId());
                body.put("name", t.getName());
                body.put("teacherRole", t.getRole());
                if (t.getSchoolId() != null) {
                    body.put("schoolId", t.getSchoolId());
                    putSchoolName(body, t.getSchoolId());
                }
            });
            return;
        }

        if ("STUDENT".equals(roleUpper)) {
            studentRepository.findByUsernameAndDeletedFalse(username).ifPresent((s) -> {
                body.put("userId", s.getId());
                body.put("studentId", s.getId());
                body.put("name", s.getName());
                if (s.getSchool() != null) {
                    body.put("schoolId", s.getSchool().getId());
                    body.put("schoolName", s.getSchool().getSchoolName());
                }
            });
            return;
        }

        if ("PARENT".equals(roleUpper)) {
            parentRepository.findByUsername(username).ifPresent((p) -> {
                body.put("userId", p.getId());
                body.put("parentId", p.getId());
                body.put("name", p.getName());
                body.put("schoolId", p.getSchoolId());

                List<Long> childIds = parentStudentRepository.findStudentIdsByParentId(p.getId());
                if (childIds == null) childIds = List.of();
                List<Map<String, Object>> children = new ArrayList<>();
                if (!childIds.isEmpty()) {
                    for (Student s : studentRepository.findAllById(childIds)) {
                        if (s == null || Boolean.TRUE.equals(s.getDeleted())) continue;
                        Map<String, Object> c = new HashMap<>();
                        c.put("id", s.getId());
                        c.put("studentId", s.getId());
                        c.put("name", s.getName());
                        if (s.getSchool() != null) {
                            c.put("schoolId", s.getSchool().getId());
                            c.put("schoolName", s.getSchool().getSchoolName());
                        }
                        if (s.getClassName() != null) c.put("className", s.getClassName());
                        if (s.getSection() != null) c.put("section", s.getSection());
                        children.add(c);
                    }
                }
                body.put("children", children);
            });
            return;
        }

        adminUserRepository.findByUsername(username).ifPresent((a) -> {
            body.put("userId", a.getId());
            if (a.getSchoolId() != null) {
                body.put("schoolId", a.getSchoolId());
                putSchoolName(body, a.getSchoolId());
            }
        });
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        String username = req == null ? null : normalize(req.username());
        String password = req == null ? null : req.password();
        if (username == null || username.isBlank() || password == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }

        AuthResult auth = authenticate(username, password);
        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        if (!isHeadOfficeActive(auth.headOfficeId(), auth.schoolId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Account disabled"));
        }

        String permRole = null;
        if ("TEACHER".equalsIgnoreCase(auth.role())) {
            // Teacher entity stores an arbitrary text role; normalize to RBAC role name for permissions.
            permRole = teacherRepository.findByUsername(auth.username())
                    .map(t -> normalizeRoleNameForPermissions(t.getRole()))
                    .orElse(null);
        }

        String token = jwtService.issueToken(new JwtService.TokenClaims(
                auth.username(),
                auth.role(),
                permRole,
                auth.adminId(),
                auth.headOfficeId(),
                auth.schoolId(),
                auth.teacherId(),
                auth.studentId(),
                auth.parentId()
        ));

        Map<String, Object> body = new HashMap<>();
        body.put("username", auth.username());
        String clientRole = normalizeRoleForClient(auth.role());
        body.put("role", clientRole);
        body.put("token", token);
        if (auth.headOfficeId() != null) body.put("headOfficeId", auth.headOfficeId());
        putHeadOfficeName(body, auth.headOfficeId());
        if (auth.schoolId() != null) body.put("schoolId", auth.schoolId());
        putSchoolName(body, auth.schoolId());
        // Permissions are still keyed by the RBAC/system role names used in the backend.
        body.put("permissions", permissionsFor(permRole != null ? permRole : auth.role(), auth.schoolId(), auth.headOfficeId()));

        String internalRoleUpper = auth.role() == null ? null : auth.role().trim().toUpperCase();
        putRoleContext(body, internalRoleUpper, auth.username());

        int childCount = 0;
        Object children = body.get("children");
        if (children instanceof List<?> list) childCount = list.size();
        body.put("homePage", homePageForClientRole(clientRole, childCount));

        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(body);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        String token = readBearer(request);
        if (token == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        JwtService.TokenClaims claims;
        try {
            claims = jwtService.verify(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        if (!isHeadOfficeActive(claims.headOfficeId(), claims.schoolId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Account disabled"));
        }
        String role = claims.role() == null ? null : claims.role().trim().toUpperCase();
        if (role == null || role.isBlank()) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String permRole = claims.permRole() == null ? null : claims.permRole().trim().toUpperCase();

        Map<String, Object> body = new HashMap<>();
        body.put("username", claims.username());
        body.put("role", normalizeRoleForClient(role));
        if (claims.headOfficeId() != null) body.put("headOfficeId", claims.headOfficeId());
        putHeadOfficeName(body, claims.headOfficeId());
        if (claims.schoolId() != null) body.put("schoolId", claims.schoolId());
        putSchoolName(body, claims.schoolId());
        body.put("permissions", permissionsFor((permRole != null && !permRole.isBlank()) ? permRole : role, claims.schoolId(), claims.headOfficeId()));

        putRoleContext(body, role, claims.username());
        int childCount = 0;
        Object children = body.get("children");
        if (children instanceof List<?> list) childCount = list.size();
        body.put("homePage", homePageForClientRole(normalizeRoleForClient(role), childCount));

        return ResponseEntity.ok(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        return ResponseEntity.ok().body(Map.of("ok", true));
    }

    private boolean isValidAdmin(String username, String password) {
        if (username == null || password == null) return false;
        if (authProperties.username() == null || authProperties.password() == null) return false;
        if (!authProperties.username().equals(username)) return false;

        String configured = authProperties.password();
        // Support either raw password (dev) or bcrypt hash.
        if (configured.startsWith("$2")) {
            return passwordEncoder.matches(password, configured);
        }
        if (configured.startsWith("{bcrypt}")) {
            return passwordEncoder.matches(password, configured.substring("{bcrypt}".length()));
        }
        return configured.equals(password);
    }

    private AuthResult authenticate(String username, String password) {
        Optional<AdminUser> admin = adminUserRepository.findByUsername(username);
        if (admin.isPresent() && Boolean.TRUE.equals(admin.get().getActive())) {
            if (passwordEncoder.matches(password, admin.get().getPasswordHash())) {
                AdminUser a = admin.get();
                String internalRole = normalizeRoleForInternal(a.getRole());
                return new AuthResult(username, internalRole, a.getId(), a.getHeadOfficeId(), a.getSchoolId(), null, null, null, null);
            }
        }

        // Legacy dev admin (application.properties) -> SUPER_ADMIN
        if (isValidAdmin(username, password)) {
            return new AuthResult(authProperties.username(), Role.SUPER_ADMIN.name(), null, null, null, null, null, null, null);
        }

        Optional<ManageTeacher> teacher = teacherRepository.findByUsername(username);
        if (teacher.isPresent() && isValidTeacherPassword(password, teacher.get().getPassword())) {
            Long schoolId = teacher.get().getSchoolId();
            Long headOfficeId = resolveHeadOfficeIdFromSchool(schoolId);
            return new AuthResult(
                    username,
                    Role.TEACHER.name(),
                    null,
                    headOfficeId,
                    schoolId,
                    teacher.get().getId(),
                    null,
                    null,
                    teacher.get().getName()
            );
        }

        Optional<Student> student = studentRepository.findByUsernameAndDeletedFalse(username);
        if (student.isPresent() && isValidStudentPassword(password, student.get().getPassword())) {
            Long schoolId = student.get().getSchool() == null ? null : student.get().getSchool().getId();
            Long headOfficeId = resolveHeadOfficeIdFromSchool(schoolId);
            return new AuthResult(username, Role.STUDENT.name(), null, headOfficeId, schoolId, null, student.get().getId(), null, student.get().getName());
        }

        Optional<Parent> parent = parentRepository.findByUsername(username);
        if (parent.isPresent() && Boolean.TRUE.equals(parent.get().getActive())) {
            if (passwordEncoder.matches(password, parent.get().getPasswordHash())) {
                Parent p = parent.get();
                Long schoolId = p.getSchoolId();
                Long headOfficeId = resolveHeadOfficeIdFromSchool(schoolId);
                return new AuthResult(username, Role.PARENT.name(), null, headOfficeId, schoolId, null, null, p.getId(), p.getName());
            }
        }

        return null;
    }

    private boolean isValidTeacherPassword(String raw, String stored) {
        if (raw == null || stored == null) return false;
        String trimmed = stored.trim();
        if (trimmed.startsWith("$2")) return passwordEncoder.matches(raw, trimmed);
        if (trimmed.startsWith("{bcrypt}")) return passwordEncoder.matches(raw, trimmed.substring("{bcrypt}".length()));
        return trimmed.equals(raw);
    }

    private boolean isValidStudentPassword(String raw, String stored) {
        if (raw == null || stored == null) return false;
        String trimmed = stored.trim();
        if (trimmed.startsWith("$2")) return passwordEncoder.matches(raw, trimmed);
        if (trimmed.startsWith("{bcrypt}")) return passwordEncoder.matches(raw, trimmed.substring("{bcrypt}".length()));
        return false;
    }

    private String normalize(String input) {
        if (input == null) return null;
        String trimmed = input.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String[] permissionsFor(String role, Long schoolId) {
        String normalized = role == null ? null : role.trim().toUpperCase();
        if (normalized == null || normalized.isBlank()) return new String[0];
        if ("SUPER_ADMIN".equals(normalized)) return new String[] {"*"};
        return rbacService.permissionsFor(normalized, schoolId).stream().sorted().toArray(String[]::new);
    }

    private String[] permissionsFor(String role, Long schoolId, Long headOfficeId) {
        Long effectiveSchoolId = schoolId;
        if (effectiveSchoolId == null && headOfficeId != null) {
            effectiveSchoolId = schoolRepository
                    .findAllByIsDeletedFalseAndHeadOfficeId(
                            headOfficeId,
                            org.springframework.data.domain.PageRequest.of(0, 1, org.springframework.data.domain.Sort.by("id").ascending())
                    )
                    .stream()
                    .findFirst()
                    .map(s -> s.getId())
                    .orElse(null);
        }
        return permissionsFor(role, effectiveSchoolId);
    }

    private void putSchoolName(Map<String, Object> body, Long schoolId) {
        if (schoolId == null || body.containsKey("schoolName")) return;
        schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .ifPresent((school) -> body.put("schoolName", school.getSchoolName()));
    }

    private void putHeadOfficeName(Map<String, Object> body, Long headOfficeId) {
        if (headOfficeId == null || body.containsKey("headOfficeName")) return;
        headOfficeRepository.findById(headOfficeId)
                .ifPresent((ho) -> body.put("headOfficeName", ho.getName()));
    }

    private Long resolveHeadOfficeIdFromSchool(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getHeadOfficeId)
                .orElse(null);
    }

    private boolean isHeadOfficeActive(Long headOfficeId, Long schoolId) {
        Long effectiveHeadOfficeId = headOfficeId != null ? headOfficeId : resolveHeadOfficeIdFromSchool(schoolId);
        if (effectiveHeadOfficeId == null) return true;
        return headOfficeRepository.findById(effectiveHeadOfficeId)
                .map(ho -> !"INACTIVE".equalsIgnoreCase(ho.getStatus()))
                .orElse(true);
    }

    private String readBearer(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null) return null;
        if (!auth.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())) return null;
        String token = auth.substring("Bearer ".length()).trim();
        return token.isEmpty() ? null : token;
    }

    private record AuthResult(
            String username,
            String role,
            Long adminId,
            Long headOfficeId,
            Long schoolId,
            Long teacherId,
            Long studentId,
            Long parentId,
            String name
    ) {
        Long userId() {
            if (adminId != null) return adminId;
            if (teacherId != null) return teacherId;
            if (studentId != null) return studentId;
            if (parentId != null) return parentId;
            return null;
        }
    }
}
