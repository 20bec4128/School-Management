package com.School.School_management.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.School.School_management.Dto.StudentTypeDto;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class PagePermissionIntegrationTest {

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

    private String pilotRole = "PILOT_TEST_ROLE";
    private String token;

    @BeforeEach
    void setUp() {
        pagePermissionService.evictAll();
 
        // Delete any existing test data to avoid conflicts
        jdbcTemplate.update("DELETE FROM rbac_role_page_permissions WHERE role_name = ?", pilotRole);
 
        // Find or create module and function
        Integer functionId;
        try {
            functionId = jdbcTemplate.queryForObject(
                    "SELECT id FROM rbac_functions WHERE slug = 'student-type'", Integer.class);
        } catch (Exception e) {
            jdbcTemplate.update("INSERT INTO rbac_modules (id, name, order_no) VALUES (999, 'Test Module', 1) ON CONFLICT DO NOTHING");
            jdbcTemplate.update("INSERT INTO rbac_functions (id, module_id, name, slug, order_no) VALUES (999, 999, 'Student Type', 'student-type', 1) ON CONFLICT DO NOTHING");
            functionId = 999;
        }
 
        // Seed a role with can_view = true and can_add = false
        jdbcTemplate.update(
                "INSERT INTO rbac_role_page_permissions (role_name, school_id, function_id, can_view, can_add, can_edit, can_delete) " +
                "VALUES (?, NULL, ?, true, false, false, false)",
                pilotRole, functionId
        );

        token = jwtService.issueToken(new JwtService.TokenClaims(
                "pilot-user",
                pilotRole,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        ));
    }

    @Test
    void testGetAllowedButPostBlocked() throws Exception {
        // GET /api/student-types should be ALLOWED (status 200)
        mockMvc.perform(get("/api/student-types")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // POST /api/student-types should be BLOCKED (status 403)
        StudentTypeDto.Request req = new StudentTypeDto.Request();
        req.setStudentType("Test Type");
        req.setHeadOfficeId(1L);

        mockMvc.perform(post("/api/student-types")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }
}
