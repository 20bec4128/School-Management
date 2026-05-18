package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ExamTermDto;
import com.School.School_management.Entity.ExamTerm;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.ExamTermRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.ExamTermService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ExamTermServiceImpl implements ExamTermService {

    private final ExamTermRepository examTermRepository;
    private final SchoolRepository schoolRepository;

    public ExamTermServiceImpl(ExamTermRepository examTermRepository, SchoolRepository schoolRepository) {
        this.examTermRepository = examTermRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamTermDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        return resolveVisibleRows(user, headOfficeId, schoolId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExamTermDto> listPaginated(Long headOfficeId, Long schoolId, int page, int size, String search) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = normalizeOptional(search);

        List<ExamTermDto> rows = list(headOfficeId, schoolId).stream()
                .filter(dto -> normalizedSearch == null || matchesSearch(dto, normalizedSearch))
                .collect(Collectors.toList());
        return slice(rows, pageable);
    }

    @Override
    public ExamTermDto create(ExamTermDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        String gradeName = normalizeRequired(dto == null ? null : dto.getGradeName(), "Grade name is required");
        Double gradePoint = normalizeRequiredNumber(dto == null ? null : dto.getGradePoint(), "Grade point is required");
        Integer markFrom = normalizeRequiredInteger(dto == null ? null : dto.getMarkFrom(), "Mark from is required");
        Integer markTo = normalizeRequiredInteger(dto == null ? null : dto.getMarkTo(), "Mark to is required");
        validateMarkRange(markFrom, markTo);

        if (examTermRepository.existsBySchoolIdAndGradeNameIgnoreCase(effectiveSchoolId, gradeName)) {
            throw new ConflictException("Exam Term already exists for this school");
        }

        ExamTerm entity = new ExamTerm();
        updateEntityFromDto(entity, dto);
        entity.setSchoolId(effectiveSchoolId);
        entity.setGradeName(gradeName);
        entity.setGradePoint(gradePoint);
        entity.setMarkFrom(markFrom);
        entity.setMarkTo(markTo);

        return toDto(examTermRepository.save(entity));
    }

    @Override
    public ExamTermDto update(Long id, ExamTermDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        ExamTerm entity = examTermRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? entity.getSchoolId() : dto.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        String gradeName = normalizeRequired(dto == null ? null : dto.getGradeName(), "Grade name is required");
        Double gradePoint = normalizeRequiredNumber(dto == null ? null : dto.getGradePoint(), "Grade point is required");
        Integer markFrom = normalizeRequiredInteger(dto == null ? null : dto.getMarkFrom(), "Mark from is required");
        Integer markTo = normalizeRequiredInteger(dto == null ? null : dto.getMarkTo(), "Mark to is required");
        validateMarkRange(markFrom, markTo);

        if (examTermRepository.existsBySchoolIdAndGradeNameIgnoreCaseAndIdNot(effectiveSchoolId, gradeName, id)) {
            throw new ConflictException("Exam Term already exists for this school");
        }

        updateEntityFromDto(entity, dto);
        entity.setSchoolId(effectiveSchoolId);
        entity.setGradeName(gradeName);
        entity.setGradePoint(gradePoint);
        entity.setMarkFrom(markFrom);
        entity.setMarkTo(markTo);

        return toDto(examTermRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        ExamTerm entity = examTermRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        examTermRepository.delete(entity);
    }

    private void updateEntityFromDto(ExamTerm entity, ExamTermDto dto) {
        entity.setGradeName(normalizeOptional(dto == null ? null : dto.getGradeName()));
        entity.setGradePoint(dto == null ? null : dto.getGradePoint());
        entity.setMarkFrom(dto == null ? null : dto.getMarkFrom());
        entity.setMarkTo(dto == null ? null : dto.getMarkTo());
        entity.setNote(normalizeOptional(dto == null ? null : dto.getNote()));
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private Long effectiveSchoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private List<ExamTerm> resolveVisibleRows(CurrentUser user, Long headOfficeId, Long schoolId) {
        if (user.isSchoolScoped()) {
            Long effectiveSchoolId = user.schoolId();
            if (effectiveSchoolId == null) throw new ForbiddenException();
            if (schoolId != null && !Objects.equals(schoolId, effectiveSchoolId)) throw new ForbiddenException();
            if (headOfficeId != null) ensureSchoolInHeadOffice(effectiveSchoolId, headOfficeId);
            return examTermRepository.findBySchoolIdOrderByIdDesc(effectiveSchoolId);
        }

        if (schoolId != null) {
            if (user.isHeadOfficeScopedAdmin()) ensureSchoolInHeadOffice(schoolId, user.headOfficeId());
            return examTermRepository.findBySchoolIdOrderByIdDesc(schoolId);
        }

        if (headOfficeId != null) {
            if (user.isHeadOfficeScopedAdmin() && !Objects.equals(headOfficeId, user.headOfficeId())) {
                throw new ForbiddenException();
            }
            return examTermRepository.findAllByOrderByIdDesc().stream()
                    .filter(row -> Objects.equals(resolveSchoolHeadOfficeId(row.getSchoolId()), headOfficeId))
                    .collect(Collectors.toList());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long effectiveHeadOfficeId = user.headOfficeId();
            return examTermRepository.findAllByOrderByIdDesc().stream()
                    .filter(row -> Objects.equals(resolveSchoolHeadOfficeId(row.getSchoolId()), effectiveHeadOfficeId))
                    .collect(Collectors.toList());
        }

        if (user.isSuperAdmin()) {
            return examTermRepository.findAllByOrderByIdDesc();
        }

        throw new BadRequestException("schoolId is required");
    }

    private Long resolveSchoolHeadOfficeId(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getHeadOfficeId)
                .orElse(null);
    }

    private ExamTermDto toDto(ExamTerm entity) {
        ExamTermDto dto = new ExamTermDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setGradeName(entity.getGradeName());
        dto.setGradePoint(entity.getGradePoint());
        dto.setMarkFrom(entity.getMarkFrom());
        dto.setMarkTo(entity.getMarkTo());
        dto.setNote(entity.getNote());
        return dto;
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse(null);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) throw new BadRequestException(message);
        return trimmed;
    }

    private Double normalizeRequiredNumber(Double value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private Integer normalizeRequiredInteger(Integer value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateMarkRange(Integer markFrom, Integer markTo) {
        if (markFrom > markTo) throw new BadRequestException("Mark from cannot be greater than mark to");
    }

    private boolean matchesSearch(ExamTermDto dto, String search) {
        String haystack = String.join(" ",
                safe(dto.getSchoolName()),
                safe(dto.getGradeName()),
                safe(dto.getGradePoint() == null ? null : dto.getGradePoint().toString()),
                safe(dto.getMarkFrom() == null ? null : dto.getMarkFrom().toString()),
                safe(dto.getMarkTo() == null ? null : dto.getMarkTo().toString()),
                safe(dto.getNote())).toLowerCase();
        return haystack.contains(search.toLowerCase());
    }

    private Page<ExamTermDto> slice(List<ExamTermDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
