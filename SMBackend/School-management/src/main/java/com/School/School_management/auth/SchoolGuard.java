package com.School.School_management.auth;

import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.SchoolRepository;
import org.springframework.stereotype.Component;

@Component
public class SchoolGuard {

    private final SchoolRepository schoolRepository;

    public SchoolGuard(SchoolRepository schoolRepository) {
        this.schoolRepository = schoolRepository;
    }

    public Long schoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user == null) throw new ForbiddenException();

        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        // ADMIN with headOfficeId = head-office scoped admin
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        // SUPER_ADMIN can optionally filter by schoolId
        return requestedSchoolId;
    }

    public Long schoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        if (user == null) throw new ForbiddenException();

        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        // ADMIN with headOfficeId = head-office scoped admin
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (user.isGlobalAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            return requestedSchoolId;
        }

        throw new ForbiddenException();
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }
}
