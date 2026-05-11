package com.School.School_management.auth;

import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;

public final class SchoolScope {
    private SchoolScope() {}

    public static Long schoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        if (user == null) throw new ForbiddenException();
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }
        if (user.isGlobalAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            return requestedSchoolId;
        }
        throw new ForbiddenException();
    }

    public static Long schoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user == null) throw new ForbiddenException();
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }
        return requestedSchoolId;
    }
}
