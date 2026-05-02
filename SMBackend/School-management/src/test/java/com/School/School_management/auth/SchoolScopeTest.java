package com.School.School_management.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import java.util.Set;
import org.junit.jupiter.api.Test;

public class SchoolScopeTest {

    @Test
    void schoolScopedRoleWriteIgnoresRequestedSchool() {
        CurrentUser user = new CurrentUser(
                "u",
                "SCHOOL_ADMIN",
                1L,
                null,
                10L,
                null,
                null,
                null,
                Set.of("*")
        );
        assertEquals(10L, SchoolScope.schoolIdForWrite(user, 99L));
        assertEquals(10L, SchoolScope.schoolIdForWrite(user, null));
    }

    @Test
    void globalAdminWriteRequiresSchoolId() {
        CurrentUser user = new CurrentUser(
                "u",
                "ADMIN",
                1L,
                null,
                null,
                null,
                null,
                null,
                Set.of("*")
        );
        assertThrows(BadRequestException.class, () -> SchoolScope.schoolIdForWrite(user, null));
        assertEquals(5L, SchoolScope.schoolIdForWrite(user, 5L));
    }

    @Test
    void missingUserIsForbidden() {
        assertThrows(ForbiddenException.class, () -> SchoolScope.schoolIdForRead(null, null));
        assertThrows(ForbiddenException.class, () -> SchoolScope.schoolIdForWrite(null, 1L));
    }
}
