package com.School.School_management;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "app.jwt.secret=0123456789abcdef0123456789abcdef",
        "app.jwt.issuer=test-issuer",
        "app.jwt.ttlMinutes=60"
})
class RbacAuthIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void apiRequiresBearerToken() throws Exception {
        mockMvc.perform(get("/api/classes"))
                .andExpect(status().isUnauthorized());
    }
}

