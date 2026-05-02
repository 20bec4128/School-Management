package com.School.School_management.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "app.jwt.secret=0123456789abcdef0123456789abcdef",
        "app.jwt.issuer=test-issuer",
        "app.jwt.ttlMinutes=60"
})
class JwtPermRoleTest {

    @Autowired
    JwtService jwtService;

    @Test
    void issueAndVerifyCarriesPermRole() {
        String token = jwtService.issueToken(new JwtService.TokenClaims(
                "u",
                "TEACHER",
                "SENIOR_TEACHER",
                null,
                null,
                10L,
                20L,
                null,
                null
        ));

        JwtService.TokenClaims verified = jwtService.verify(token);
        assertEquals("u", verified.username());
        assertEquals("TEACHER", verified.role());
        assertEquals("SENIOR_TEACHER", verified.permRole());
        assertEquals(10L, verified.schoolId());
        assertEquals(20L, verified.teacherId());
    }

    @Test
    void missingPermRoleIsNull() {
        String token = jwtService.issueToken(new JwtService.TokenClaims(
                "u",
                "TEACHER",
                null,
                null,
                null,
                10L,
                20L,
                null,
                null
        ));
        JwtService.TokenClaims verified = jwtService.verify(token);
        assertNull(verified.permRole());
    }
}

