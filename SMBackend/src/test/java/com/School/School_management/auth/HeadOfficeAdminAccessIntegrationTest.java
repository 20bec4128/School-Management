package com.School.School_management.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.School.School_management.Dto.CandidateDto;
import com.School.School_management.Dto.DonorDto;
import com.School.School_management.Dto.FeeCollectionDto;
import com.School.School_management.Dto.EmailSettingDto;
import com.School.School_management.Dto.ExamGradeDto;
import com.School.School_management.Dto.ExamTermDto;
import com.School.School_management.Dto.PaymentSettingDto;
import com.School.School_management.Dto.ScholarshipDto;
import com.School.School_management.Dto.ScheduleDto;
import com.School.School_management.Dto.SuggestionDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {
        "app.jwt.secret=0123456789abcdef0123456789abcdef",
        "app.jwt.issuer=test-issuer",
        "app.jwt.ttlMinutes=60"
})
class HeadOfficeAdminAccessIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PagePermissionService pagePermissionService;

    private Long headOfficeId;
    private Long schoolId;
    private Long classId;
    private Long sectionId;
    private Long studentId;
    private String schoolName;
    private String adminJwt;
    private String schoolAdminJwt;
    private String superAdminJwt;
    private String teacherJwt;
    private Long examGradeId;
    private Long examTermId;
    private Long scheduleId;
    private Long suggestionId;

    @BeforeEach
    void setUp() {
        pagePermissionService.evictAll();

        seedScopeData();
        seedPagePermissions();
        seedAcademicArtifacts();

        adminJwt = jwtService.issueToken(new JwtService.TokenClaims(
                "ho-admin",
                "ADMIN",
                null,
                null,
                headOfficeId,
                null,
                null,
                null,
                null
        ));

        superAdminJwt = jwtService.issueToken(new JwtService.TokenClaims(
                "super-admin",
                "SUPER_ADMIN",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        ));

        schoolAdminJwt = jwtService.issueToken(new JwtService.TokenClaims(
                "school-admin",
                "SCHOOL_ADMIN",
                null,
                null,
                headOfficeId,
                schoolId,
                null,
                null,
                null
        ));

        teacherJwt = jwtService.issueToken(new JwtService.TokenClaims(
                "teacher-user",
                "TEACHER",
                null,
                null,
                null,
                schoolId,
                11L,
                null,
                null
        ));
    }

    @Test
    void headOfficeAdminCanAccessAndMutatePageProtectedControllers() throws Exception {
        assertOk(get("/api/payment-settings")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/payment-settings/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/email-settings")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/emails/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("category", "ABSENT_ATTENDANCE")
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/candidates")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("classId", classId.toString())
                .param("sectionId", sectionId.toString())
                .param("academicYear", "2025-26")
                .param("search", "")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/donors")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("academicYear", "2025-26")
                .param("search", "")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/scholarships")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("classId", classId.toString())
                .param("sectionId", sectionId.toString())
                .param("search", "")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/head-offices")
                .param("page", "0")
                .param("size", "500")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/question-bank/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/attendances")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("examTerm", "Teacher Attendance")
                .param("className", "Teacher")
                .param("sectionName", "History")
                .param("subjectName", "Attendance")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/attendances/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("examTerm", "Teacher Attendance")
                .param("className", "Teacher")
                .param("sectionName", "History")
                .param("subjectName", "Attendance")
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        Long paymentSettingId = createPaymentSetting();
        assertOk(get("/api/payment-settings/" + paymentSettingId)
                .header("Authorization", bearer(adminJwt)));
        updatePaymentSetting(paymentSettingId);
        assertOk(get("/api/payment-settings/" + paymentSettingId)
                .header("Authorization", bearer(adminJwt)));
        assertNoContent(delete("/api/payment-settings/" + paymentSettingId)
                .header("Authorization", bearer(adminJwt)));

        Long emailSettingId = createEmailSetting();
        assertOk(get("/api/email-settings/" + emailSettingId)
                .header("Authorization", bearer(adminJwt)));
        updateEmailSetting(emailSettingId);
        assertOk(get("/api/email-settings/" + emailSettingId)
                .header("Authorization", bearer(adminJwt)));
        assertNoContent(delete("/api/email-settings/" + emailSettingId)
                .header("Authorization", bearer(adminJwt)));

        Long candidateId = createCandidate();
        assertOk(get("/api/candidates").param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("classId", classId.toString())
                .param("sectionId", sectionId.toString())
                .header("Authorization", bearer(adminJwt)));
        updateCandidate(candidateId);
        assertOk(delete("/api/candidates/" + candidateId)
                .header("Authorization", bearer(adminJwt)));

        Long donorId = createDonor();
        assertOk(get("/api/donors")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(adminJwt)));
        updateDonor(donorId);
        assertOk(delete("/api/donors/" + donorId)
                .header("Authorization", bearer(adminJwt)));

        Long scholarshipId = createScholarship();
        assertOk(get("/api/scholarships")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("classId", classId.toString())
                .param("sectionId", sectionId.toString())
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/lesson-status/page-data")
                .param("schoolId", schoolId.toString())
                .param("classId", classId.toString())
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/lesson-plan-entries")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/galleries/page")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/gallery-images/page")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/gallery-videos/page")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/complain-types")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/complain-types/school/" + schoolId)
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/complains")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/complains/school/" + schoolId)
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/guardians")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/fee-collections/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminJwt)));

        assertOk(get("/api/visitor-purposes")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/visitor-infos")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/call-logs/page")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/postal-dispatches")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/postal-receives")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/notices")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/news")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/holidays")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/events")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));
        assertOk(get("/api/fee-collections/page")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(schoolAdminJwt)));
        assertOk(get("/api/emails/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("category", "ABSENT_ATTENDANCE")
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(schoolAdminJwt)));
        assertOk(get("/api/guardians")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(schoolAdminJwt)));
        updateScholarship(scholarshipId);
        assertOk(delete("/api/scholarships/" + scholarshipId)
                .header("Authorization", bearer(adminJwt)));
    }

    @Test
    void superAdminHeadOfficeAdminAndSchoolAdminCanAccessExamScheduleAndSuggestionFlows() throws Exception {
        assertOk(get("/api/exam-grades")
                .header("Authorization", bearer(superAdminJwt)));
        assertOk(get("/api/exam-grades")
                .param("headOfficeId", headOfficeId.toString())
                .header("Authorization", bearer(adminJwt)));
        assertOk(get("/api/exam-grades")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/exam-terms")
                .header("Authorization", bearer(superAdminJwt)));
        assertOk(get("/api/exam-terms")
                .param("headOfficeId", headOfficeId.toString())
                .header("Authorization", bearer(adminJwt)));
        assertOk(get("/api/exam-terms")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));

        ScheduleDto scheduleRequest = new ScheduleDto();
        scheduleRequest.setSchoolId(schoolId);
        scheduleRequest.setExamTerm("Term 1");
        scheduleRequest.setClassName("Class 1");
        scheduleRequest.setSubjectName("Mathematics");
        scheduleRequest.setExamDate(LocalDate.now().plusDays(2));
        scheduleRequest.setStartTime(LocalTime.of(10, 0));
        scheduleRequest.setEndTime(LocalTime.of(12, 0));
        scheduleRequest.setRoomNo("102");
        scheduleRequest.setNote("Created through API");
        Long createdScheduleId = postAndGetId("/api/schedules", scheduleRequest, 201);

        ScheduleDto scheduleUpdate = new ScheduleDto();
        scheduleUpdate.setSchoolId(schoolId);
        scheduleUpdate.setExamTerm("Term 1");
        scheduleUpdate.setClassName("Class 1");
        scheduleUpdate.setSubjectName("Mathematics");
        scheduleUpdate.setExamDate(LocalDate.now().plusDays(3));
        scheduleUpdate.setStartTime(LocalTime.of(11, 0));
        scheduleUpdate.setEndTime(LocalTime.of(13, 0));
        scheduleUpdate.setRoomNo("103");
        scheduleUpdate.setNote("Updated through API");
        putAndExpectStatus("/api/schedules/" + createdScheduleId, scheduleUpdate, 200, schoolAdminJwt);

        assertOk(get("/api/schedules/school/" + schoolId)
                .header("Authorization", bearer(superAdminJwt)));
        assertOk(get("/api/schedules/school/" + schoolId)
                .header("Authorization", bearer(adminJwt)));
        assertOk(get("/api/schedules/school/" + schoolId)
                .header("Authorization", bearer(schoolAdminJwt)));
        assertOk(get("/api/schedules/" + createdScheduleId)
                .header("Authorization", bearer(schoolAdminJwt)));

        assertNoContent(delete("/api/schedules/" + createdScheduleId)
                .header("Authorization", bearer(schoolAdminJwt)));

        assertOk(get("/api/suggestions")
                .header("Authorization", bearer(superAdminJwt)));
        assertOk(get("/api/suggestions")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(adminJwt)));
        assertOk(get("/api/suggestions")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(schoolAdminJwt)));
        assertOk(get("/api/suggestions/" + suggestionId)
                .header("Authorization", bearer(superAdminJwt)));
        assertOk(get("/api/suggestions/" + suggestionId)
                .header("Authorization", bearer(adminJwt)));
        assertOk(get("/api/suggestions/" + suggestionId)
                .header("Authorization", bearer(schoolAdminJwt)));
    }

    @Test
    void nonPrivilegedTeacherStillGetsForbiddenForPageActions() throws Exception {
        assertForbidden(get("/api/payment-settings")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(post("/api/payment-settings")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(put("/api/payment-settings/1")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(delete("/api/payment-settings/1")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/email-settings")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/emails/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("category", "ABSENT_ATTENDANCE")
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(post("/api/email-settings")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(put("/api/email-settings/1")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(delete("/api/email-settings/1")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/candidates")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(post("/api/candidates")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(put("/api/candidates/1")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(delete("/api/candidates/1")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/donors")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(post("/api/donors")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(put("/api/donors/1")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(delete("/api/donors/1")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/scholarships")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(post("/api/scholarships")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(put("/api/scholarships/1")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(delete("/api/scholarships/1")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/head-offices")
                .param("page", "0")
                .param("size", "500")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/question-bank/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/attendances")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("examTerm", "Teacher Attendance")
                .param("className", "Teacher")
                .param("sectionName", "History")
                .param("subjectName", "Attendance")
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/attendances/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("examTerm", "Teacher Attendance")
                .param("className", "Teacher")
                .param("sectionName", "History")
                .param("subjectName", "Attendance")
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/lesson-status/page-data")
                .param("schoolId", schoolId.toString())
                .param("classId", classId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(put("/api/lesson-status/update-topic")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(put("/api/lesson-status/update-lesson")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));

        assertForbidden(get("/api/lesson-plan-entries")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(post("/api/lesson-plan-entries")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(put("/api/lesson-plan-entries/1")
                .header("Authorization", bearer(teacherJwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"));
        assertForbidden(delete("/api/lesson-plan-entries/1")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/galleries/page")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/gallery-images/page")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/gallery-videos/page")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/complain-types")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/complain-types/school/" + schoolId)
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/complains")
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/complains/school/" + schoolId)
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/guardians")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/fee-collections/page")
                .param("headOfficeId", headOfficeId.toString())
                .param("schoolId", schoolId.toString())
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/visitor-purposes")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/visitor-infos")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/call-logs/page")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/postal-dispatches")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/postal-receives")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));

        assertForbidden(get("/api/notices")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/news")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/holidays")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
        assertForbidden(get("/api/events")
                .param("schoolId", schoolId.toString())
                .header("Authorization", bearer(teacherJwt)));
    }

    private void seedScopeData() {
        String scopeSuffix = UUID.randomUUID().toString().substring(0, 8);
        schoolName = "Test School " + scopeSuffix;
        String schoolUrl = "test-school-" + scopeSuffix;
        String email = "test-" + scopeSuffix + "@example.com";

        LocalDateTime now = LocalDateTime.now();

        jdbcTemplate.update(
                "INSERT INTO head_offices (name, status, created_at, updated_at) VALUES (?, ?, ?, ?)",
                "Test Head Office " + scopeSuffix,
                "ACTIVE",
                Timestamp.valueOf(now),
                Timestamp.valueOf(now));
        headOfficeId = jdbcTemplate.queryForObject(
                "SELECT id FROM head_offices WHERE name = ?",
                Long.class,
                "Test Head Office " + scopeSuffix);

        jdbcTemplate.update(
                "INSERT INTO schools (school_url, school_name, email, status, head_office_id, is_deleted) VALUES (?, ?, ?, ?, ?, ?)",
                schoolUrl,
                schoolName,
                email,
                "ACTIVE",
                headOfficeId,
                false);
        schoolId = jdbcTemplate.queryForObject(
                "SELECT id FROM schools WHERE school_url = ?",
                Long.class,
                schoolUrl);

        jdbcTemplate.update(
                "INSERT INTO classes (school_id, class_name, numeric_name, note) VALUES (?, ?, ?, ?)",
                schoolId,
                "Class 1",
                "1",
                "Test class");
        classId = jdbcTemplate.queryForObject(
                "SELECT id FROM classes WHERE school_id = ? AND class_name = ?",
                Long.class,
                schoolId,
                "Class 1");

        jdbcTemplate.update(
                "INSERT INTO sections (school_id, class_id, name, note) VALUES (?, ?, ?, ?)",
                schoolId,
                classId,
                "A",
                "Test section");
        sectionId = jdbcTemplate.queryForObject(
                "SELECT id FROM sections WHERE school_id = ? AND class_id = ? AND name = ?",
                Long.class,
                schoolId,
                classId,
                "A");

        String admissionNo = "ADM-" + scopeSuffix;
        String username = "student-" + scopeSuffix;
        jdbcTemplate.update(
                "INSERT INTO students (school_id, name, admission_no, student_type, class_name, section, class_id, section_id, username, password, deleted) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                schoolId,
                "Student " + scopeSuffix,
                admissionNo,
                "GENERAL",
                "Class 1",
                "A",
                classId,
                sectionId,
                username,
                "secret123",
                false);
        studentId = jdbcTemplate.queryForObject(
                "SELECT id FROM students WHERE admission_no = ?",
                Long.class,
                admissionNo);
    }

    private void seedPagePermissions() {
        jdbcTemplate.update("DELETE FROM rbac_role_page_permissions WHERE role_name = ? AND school_id = ?", "ADMIN", schoolId);
        jdbcTemplate.update("DELETE FROM rbac_role_page_permissions WHERE role_name = ? AND school_id = ?", "SCHOOL_ADMIN", schoolId);

        grantAllActions("ADMIN", "payment-setting");
        grantAllActions("ADMIN", "email-setting");
        grantAllActions("ADMIN", "absent-email");
        grantAllActions("ADMIN", "candidate");
        grantAllActions("ADMIN", "donar");
        grantAllActions("ADMIN", "scholarship");
        grantAllActions("ADMIN", "complain-type");
        grantAllActions("ADMIN", "manage-complain");
        grantViewOnlyGlobal("ADMIN", "head-offices");
        grantAllActions("ADMIN", "question-bank");
        grantAllActions("ADMIN", "attendance");
        grantAllActions("ADMIN", "exam-grade");
        grantAllActions("ADMIN", "exam-term");
        grantAllActions("ADMIN", "schedule");
        grantAllActions("ADMIN", "suggestion");
        grantAllActions("ADMIN", "visitor-purpose");
        grantAllActions("ADMIN", "visitor-info");
        grantAllActions("ADMIN", "call-log");
        grantAllActions("ADMIN", "postal-dispatch");
        grantAllActions("ADMIN", "postal-receive");
        grantAllActions("ADMIN", "gallery");
        grantAllActions("ADMIN", "guardian");
        grantAllActions("ADMIN", "fee-collection");

        grantAllActions("SCHOOL_ADMIN", "visitor-purpose");
        grantAllActions("SCHOOL_ADMIN", "visitor-info");
        grantAllActions("SCHOOL_ADMIN", "call-log");
        grantAllActions("SCHOOL_ADMIN", "postal-dispatch");
        grantAllActions("SCHOOL_ADMIN", "postal-receive");
        grantAllActions("SCHOOL_ADMIN", "absent-email");
        grantAllActions("SCHOOL_ADMIN", "complain-type");
        grantAllActions("SCHOOL_ADMIN", "manage-complain");
        grantAllActions("SCHOOL_ADMIN", "exam-grade");
        grantAllActions("SCHOOL_ADMIN", "exam-term");
        grantAllActions("SCHOOL_ADMIN", "schedule");
        grantAllActions("SCHOOL_ADMIN", "suggestion");
        grantAllActions("SCHOOL_ADMIN", "gallery");
        grantAllActions("SCHOOL_ADMIN", "notice");
        grantAllActions("SCHOOL_ADMIN", "news");
        grantAllActions("SCHOOL_ADMIN", "holiday");
        grantAllActions("SCHOOL_ADMIN", "event");
        grantAllActions("SCHOOL_ADMIN", "guardian");
        grantAllActions("SCHOOL_ADMIN", "fee-collection");
    }

    private void seedAcademicArtifacts() {
        LocalDateTime now = LocalDateTime.now();

        jdbcTemplate.update(
                "INSERT INTO exam_grades (school_id, grade_name, grade_point, mark_from, mark_to, note) VALUES (?, ?, ?, ?, ?, ?)",
                schoolId,
                "A",
                4.0,
                90,
                100,
                "Exam grade note");
        examGradeId = jdbcTemplate.queryForObject(
                "SELECT id FROM exam_grades WHERE school_id = ? AND grade_name = ?",
                Long.class,
                schoolId,
                "A");

        jdbcTemplate.update(
                "INSERT INTO exam_terms (school_id, grade_name, grade_point, mark_from, mark_to, note) VALUES (?, ?, ?, ?, ?, ?)",
                schoolId,
                "Term 1",
                3.5,
                70,
                89,
                "Exam term note");
        examTermId = jdbcTemplate.queryForObject(
                "SELECT id FROM exam_terms WHERE school_id = ? AND grade_name = ?",
                Long.class,
                schoolId,
                "Term 1");

        jdbcTemplate.update(
                "INSERT INTO schedule (school_id, exam_term, class_name, subject_name, exam_date, start_time, end_time, room_no, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                schoolId,
                "Term 1",
                "Class 1",
                "Mathematics",
                LocalDate.now().plusDays(1),
                LocalTime.of(9, 0),
                LocalTime.of(11, 0),
                "101",
                "Schedule note");
        scheduleId = jdbcTemplate.queryForObject(
                "SELECT id FROM schedule WHERE school_id = ? AND exam_term = ? AND subject_name = ?",
                Long.class,
                schoolId,
                "Term 1",
                "Mathematics");

        jdbcTemplate.update(
                "INSERT INTO suggestions (head_office_id, school_id, title, exam_term, class_name, subject_name, suggestion_text, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                headOfficeId,
                schoolId,
                "Improve Math",
                "Term 1",
                "Class 1",
                "Mathematics",
                "Practice more algebra questions",
                "Suggestion note",
                Timestamp.valueOf(now),
                Timestamp.valueOf(now));
        suggestionId = jdbcTemplate.queryForObject(
                "SELECT id FROM suggestions WHERE school_id = ? AND title = ?",
                Long.class,
                schoolId,
                "Improve Math");
    }

    private void grantAllActions(String role, String slug) {
        Integer functionId = resolveFunctionId(slug);
        jdbcTemplate.update(
                "INSERT INTO rbac_role_page_permissions (role_name, school_id, function_id, can_view, can_add, can_edit, can_delete) " +
                "VALUES (?, ?, ?, true, true, true, true)",
                role,
                schoolId,
                functionId);
    }

    private void grantViewOnlyGlobal(String role, String slug) {
        Integer functionId = resolveFunctionId(slug);
        jdbcTemplate.update(
                "INSERT INTO rbac_role_page_permissions (role_name, school_id, function_id, can_view, can_add, can_edit, can_delete) " +
                "VALUES (?, NULL, ?, true, false, false, false)",
                role,
                functionId);
    }

    private Integer resolveFunctionId(String slug) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id FROM rbac_functions WHERE slug = ?",
                    Integer.class,
                    slug);
        } catch (Exception ignored) {
            jdbcTemplate.update(
                    "INSERT INTO rbac_modules (name, order_no) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
                    "Test Module",
                    999);
            Integer moduleId = jdbcTemplate.queryForObject(
                    "SELECT id FROM rbac_modules WHERE name = ?",
                    Integer.class,
                    "Test Module");
            jdbcTemplate.update(
                    "INSERT INTO rbac_functions (module_id, name, slug, order_no) VALUES (?, ?, ?, ?) ON CONFLICT (slug) DO NOTHING",
                    moduleId,
                    slug,
                    slug,
                    999);
            return jdbcTemplate.queryForObject(
                    "SELECT id FROM rbac_functions WHERE slug = ?",
                    Integer.class,
                    slug);
        }
    }

    private Long createPaymentSetting() throws Exception {
        PaymentSettingDto dto = new PaymentSettingDto();
        dto.setHeadOfficeId(headOfficeId);
        dto.setSchoolId(schoolId);
        dto.setSchoolName(schoolName);
        dto.setGateway("PAYPAL");
        dto.setPaypalEmail("payments@example.com");
        dto.setIsActive("Yes");

        return postAndGetId("/api/payment-settings", dto, 201);
    }

    private void updatePaymentSetting(Long id) throws Exception {
        PaymentSettingDto dto = new PaymentSettingDto();
        dto.setHeadOfficeId(headOfficeId);
        dto.setSchoolId(schoolId);
        dto.setSchoolName(schoolName);
        dto.setGateway("STRIPE");
        dto.setPaypalEmail("billing@example.com");
        dto.setIsActive("No");

        putAndExpectStatus("/api/payment-settings/" + id, dto, 200);
    }

    private Long createEmailSetting() throws Exception {
        EmailSettingDto dto = EmailSettingDto.builder()
                .headOfficeId(headOfficeId)
                .schoolId(schoolId)
                .schoolName(schoolName)
                .emailProtocol("SMTP")
                .emailType("HOSTED")
                .charSet("UTF-8")
                .smtpHost("smtp.example.com")
                .smtpPort(587)
                .smtpUsername("smtp-user")
                .smtpPassword("smtp-pass")
                .smtpSecurity("TLS")
                .smtpTimeout(5)
                .priority("High")
                .fromName("Admin")
                .fromEmail("admin@example.com")
                .build();

        return postAndGetId("/api/email-settings", dto, 201);
    }

    private void updateEmailSetting(Long id) throws Exception {
        EmailSettingDto dto = EmailSettingDto.builder()
                .headOfficeId(headOfficeId)
                .schoolId(schoolId)
                .schoolName(schoolName)
                .emailProtocol("SMTP")
                .emailType("HOSTED")
                .charSet("UTF-8")
                .smtpHost("smtp2.example.com")
                .smtpPort(465)
                .smtpUsername("smtp-user-2")
                .smtpPassword("smtp-pass-2")
                .smtpSecurity("SSL")
                .smtpTimeout(6)
                .priority("Normal")
                .fromName("Admin Updated")
                .fromEmail("admin-updated@example.com")
                .build();

        putAndExpectStatus("/api/email-settings/" + id, dto, 200);
    }

    private Long createCandidate() throws Exception {
        CandidateDto.Request request = new CandidateDto.Request();
        request.setSchoolId(schoolId);
        request.setClassId(classId);
        request.setSectionId(sectionId);
        request.setStudentId(studentId);
        request.setAcademicYear("2025-26");
        request.setNote("Initial candidate note");

        return postAndGetId("/api/candidates", request, 201);
    }

    private void updateCandidate(Long id) throws Exception {
        CandidateDto.Request request = new CandidateDto.Request();
        request.setSchoolId(schoolId);
        request.setClassId(classId);
        request.setSectionId(sectionId);
        request.setStudentId(studentId);
        request.setAcademicYear("2025-26");
        request.setNote("Updated candidate note");

        putAndExpectStatus("/api/candidates/" + id, request, 200);
    }

    private Long createDonor() throws Exception {
        DonorDto.Request request = new DonorDto.Request();
        request.setSchoolId(schoolId);
        request.setAcademicYear("2025-26");
        request.setDonorType("Individual");
        request.setDonorName("Main Donor");
        request.setContactName("Contact Person");
        request.setEmail("donor@example.com");
        request.setPhone("555-0100");
        request.setAmount(new BigDecimal("150.00"));
        request.setAddress("Test Address");
        request.setNote("Initial donor note");

        return postAndGetId("/api/donors", request, 201);
    }

    private void updateDonor(Long id) throws Exception {
        DonorDto.Request request = new DonorDto.Request();
        request.setSchoolId(schoolId);
        request.setAcademicYear("2025-26");
        request.setDonorType("Organization");
        request.setDonorName("Updated Donor");
        request.setContactName("Updated Contact");
        request.setEmail("donor-updated@example.com");
        request.setPhone("555-0101");
        request.setAmount(new BigDecimal("250.00"));
        request.setAddress("Updated Address");
        request.setNote("Updated donor note");

        putAndExpectStatus("/api/donors/" + id, request, 200);
    }

    private Long createScholarship() throws Exception {
        ScholarshipDto.Request request = new ScholarshipDto.Request();
        request.setSchoolId(schoolId);
        request.setClassId(classId);
        request.setSectionId(sectionId);
        request.setStudentId(studentId);
        request.setAmount(new BigDecimal("75.00"));
        request.setPaymentDate(LocalDate.now().plusDays(1));
        request.setNote("Initial scholarship note");

        return postAndGetId("/api/scholarships", request, 201);
    }

    private void updateScholarship(Long id) throws Exception {
        ScholarshipDto.Request request = new ScholarshipDto.Request();
        request.setSchoolId(schoolId);
        request.setClassId(classId);
        request.setSectionId(sectionId);
        request.setStudentId(studentId);
        request.setAmount(new BigDecimal("95.00"));
        request.setPaymentDate(LocalDate.now().plusDays(2));
        request.setNote("Updated scholarship note");

        putAndExpectStatus("/api/scholarships/" + id, request, 200);
    }

    private Long postAndGetId(String path, Object payload, int expectedStatus) throws Exception {
        return postAndGetId(path, payload, expectedStatus, adminJwt);
    }

    private Long postAndGetId(String path, Object payload, int expectedStatus, String token) throws Exception {
        String response = mockMvc.perform(post(path)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().is(expectedStatus))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return extractId(response);
    }

    private void putAndExpectStatus(String path, Object payload, int expectedStatus) throws Exception {
        putAndExpectStatus(path, payload, expectedStatus, adminJwt);
    }

    private void putAndExpectStatus(String path, Object payload, int expectedStatus, String token) throws Exception {
        mockMvc.perform(put(path)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().is(expectedStatus));
    }

    private void assertOk(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder requestBuilder) throws Exception {
        mockMvc.perform(requestBuilder).andExpect(status().isOk());
    }

    private void assertNoContent(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder requestBuilder) throws Exception {
        mockMvc.perform(requestBuilder).andExpect(status().isNoContent());
    }

    private void assertForbidden(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder requestBuilder) throws Exception {
        mockMvc.perform(requestBuilder).andExpect(status().isForbidden());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private Long extractId(String responseBody) throws Exception {
        if (responseBody == null || responseBody.isBlank()) {
            throw new IllegalStateException("Expected JSON response containing an id");
        }
        JsonNode node = objectMapper.readTree(responseBody);
        if (!node.hasNonNull("id")) {
            throw new IllegalStateException("Response did not include an id field: " + responseBody);
        }
        return node.get("id").asLong();
    }
}
