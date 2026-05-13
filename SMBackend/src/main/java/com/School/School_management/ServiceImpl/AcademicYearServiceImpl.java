package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.AcademicYearDto;
import com.School.School_management.Entity.AcademicYear;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.AcademicYearRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.AcademicYearService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AcademicYearServiceImpl implements AcademicYearService {

    private final AcademicYearRepository academicYearRepository;
    private final SchoolRepository schoolRepository;

    public AcademicYearServiceImpl(AcademicYearRepository academicYearRepository, SchoolRepository schoolRepository) {
        this.academicYearRepository = academicYearRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AcademicYearDto> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return academicYearRepository.findBySchoolIdOrderBySessionStartDesc(user.schoolId())
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (schoolId == null) {
                return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(user.headOfficeId())
                        .stream()
                        .flatMap(school -> academicYearRepository.findBySchoolIdOrderBySessionStartDesc(school.getId()).stream())
                        .sorted(
                                Comparator.comparing(AcademicYear::getSessionStart, Comparator.nullsLast(Comparator.reverseOrder()))
                                        .thenComparing(AcademicYear::getId, Comparator.nullsLast(Comparator.reverseOrder()))
                        )
                        .map(this::toDto)
                        .collect(Collectors.toList());
            }
            ensureSchoolInHeadOffice(schoolId, user.headOfficeId());
            return academicYearRepository.findBySchoolIdOrderBySessionStartDesc(schoolId)
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        }

        if (schoolId == null) {
            return academicYearRepository.findAllByOrderBySessionStartDesc()
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        }

        return academicYearRepository.findBySchoolIdOrderBySessionStartDesc(schoolId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public AcademicYearDto create(AcademicYearDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long schoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        LocalDate sessionStart = requireDate(dto == null ? null : dto.getSessionStart(), "sessionStart is required");
        LocalDate sessionEnd = requireDate(dto == null ? null : dto.getSessionEnd(), "sessionEnd is required");
        String academicYear = buildAcademicYear(sessionStart, sessionEnd);
        String note = normalizeOptional(dto == null ? null : dto.getNote());
        boolean running = Boolean.TRUE.equals(dto == null ? null : dto.getIsRunning());

        if (academicYearRepository.existsBySchoolIdAndAcademicYearIgnoreCase(schoolId, academicYear)) {
            throw new ConflictException("Academic year already exists for this school");
        }

        AcademicYear entity = new AcademicYear();
        entity.setSchoolId(schoolId);
        entity.setAcademicYear(academicYear);
        entity.setSessionStart(sessionStart);
        entity.setSessionEnd(sessionEnd);
        entity.setIsRunning(running);
        entity.setNote(note);

        AcademicYear saved = academicYearRepository.save(entity);
        if (Boolean.TRUE.equals(saved.getIsRunning())) {
            academicYearRepository.clearRunningFlagForSchool(schoolId, saved.getId());
        }
        return toDto(saved);
    }

    @Override
    public AcademicYearDto update(Long id, AcademicYearDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        AcademicYear entity = academicYearRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureSchoolAccess(user, entity.getSchoolId());

        LocalDate sessionStart = requireDate(dto == null ? null : dto.getSessionStart(), "sessionStart is required");
        LocalDate sessionEnd = requireDate(dto == null ? null : dto.getSessionEnd(), "sessionEnd is required");
        String academicYear = buildAcademicYear(sessionStart, sessionEnd);
        String note = normalizeOptional(dto == null ? null : dto.getNote());
        boolean running = Boolean.TRUE.equals(dto == null ? null : dto.getIsRunning());

        if (!Objects.equals(entity.getAcademicYear(), academicYear)
                && academicYearRepository.existsBySchoolIdAndAcademicYearIgnoreCaseAndIdNot(entity.getSchoolId(), academicYear, entity.getId())) {
            throw new ConflictException("Academic year already exists for this school");
        }

        entity.setAcademicYear(academicYear);
        entity.setSessionStart(sessionStart);
        entity.setSessionEnd(sessionEnd);
        entity.setIsRunning(running);
        entity.setNote(note);

        AcademicYear saved = academicYearRepository.save(entity);
        if (Boolean.TRUE.equals(saved.getIsRunning())) {
            academicYearRepository.clearRunningFlagForSchool(saved.getSchoolId(), saved.getId());
        }
        return toDto(saved);
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        AcademicYear entity = academicYearRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureSchoolAccess(user, entity.getSchoolId());
        academicYearRepository.delete(entity);
    }

    private void ensureSchoolAccess(CurrentUser user, Long schoolId) {
        if (user.isSchoolScoped()) {
            if (!Objects.equals(user.schoolId(), schoolId)) {
                throw new ForbiddenException();
            }
            return;
        }

        if (user.isHeadOfficeScopedAdmin()) {
            ensureSchoolInHeadOffice(schoolId, user.headOfficeId());
        }
    }

    private Long effectiveSchoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) {
                throw new BadRequestException("schoolId is required");
            }
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (requestedSchoolId == null) {
            throw new BadRequestException("schoolId is required");
        }
        return requestedSchoolId;
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private AcademicYearDto toDto(AcademicYear entity) {
        AcademicYearDto dto = new AcademicYearDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setSessionStart(entity.getSessionStart());
        dto.setSessionEnd(entity.getSessionEnd());
        dto.setIsRunning(Boolean.TRUE.equals(entity.getIsRunning()));
        dto.setNote(entity.getNote());
        return dto;
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse(null);
    }

    private LocalDate requireDate(LocalDate value, String message) {
        if (value == null) {
            throw new BadRequestException(message);
        }
        return value;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String buildAcademicYear(LocalDate sessionStart, LocalDate sessionEnd) {
        if (sessionEnd.isBefore(sessionStart)) {
            throw new BadRequestException("sessionEnd must be after sessionStart");
        }
        return sessionStart.getYear() + "-" + sessionEnd.getYear();
    }
}
