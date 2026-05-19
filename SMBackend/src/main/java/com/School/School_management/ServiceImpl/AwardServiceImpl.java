package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.AwardDto;
import com.School.School_management.Entity.Award;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.AwardRepository;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Service.AwardService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.function.Predicate;
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
public class AwardServiceImpl implements AwardService {

    private final AwardRepository awardRepository;
    private final StudentRepository studentRepository;
    private final EmployeeRepository employeeRepository;
    private final SchoolRepository schoolRepository;

    public AwardServiceImpl(
            AwardRepository awardRepository,
            StudentRepository studentRepository,
            EmployeeRepository employeeRepository,
            SchoolRepository schoolRepository
    ) {
        this.awardRepository = awardRepository;
        this.studentRepository = studentRepository;
        this.employeeRepository = employeeRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AwardDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        return fetchScopedRows(scopedSchoolIds).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AwardDto> listPaginated(
            Long headOfficeId,
            Long schoolId,
            String userType,
            String title,
            String gift,
            String search,
            int page,
            int size
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedUserType = normalizeOptional(userType);
        String normalizedTitle = normalizeOptional(title);
        String normalizedGift = normalizeOptional(gift);
        String normalizedSearch = normalizeOptional(search);

        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        List<AwardDto> filtered = fetchScopedRows(scopedSchoolIds).stream()
                .map(this::toDto)
                .filter(matches(normalizedUserType, normalizedTitle, normalizedGift, normalizedSearch))
                .collect(Collectors.toList());
        return slice(filtered, pageable);
    }

    @Override
    public AwardDto create(AwardDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");

        Long effectiveSchoolId = resolveSchoolId(dto.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        Long effectiveHeadOfficeId = resolveHeadOfficeId(effectiveSchoolId, dto.getHeadOfficeId());

        Award entity = new Award();
        applyDto(entity, dto, effectiveSchoolId, effectiveHeadOfficeId);
        return toDto(awardRepository.save(entity));
    }

    @Override
    public AwardDto update(Long id, AwardDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");

        Award entity = awardRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = resolveSchoolId(dto.getSchoolId() != null ? dto.getSchoolId() : entity.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        Long effectiveHeadOfficeId = resolveHeadOfficeId(effectiveSchoolId, dto.getHeadOfficeId() != null ? dto.getHeadOfficeId() : entity.getHeadOfficeId());

        applyDto(entity, dto, effectiveSchoolId, effectiveHeadOfficeId);
        return toDto(awardRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Award entity = awardRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        ensureUserCanRead(user, entity.getSchoolId());
        entity.setDeleted(true);
        awardRepository.save(entity);
    }

    private List<Award> fetchScopedRows(List<Long> scopedSchoolIds) {
        if (scopedSchoolIds == null) {
            return awardRepository.findAllByDeletedFalseOrderByIdDesc();
        }
        if (scopedSchoolIds.isEmpty()) {
            return List.of();
        }
        if (scopedSchoolIds.size() == 1) {
            return awardRepository.findBySchoolIdAndDeletedFalseOrderByIdDesc(scopedSchoolIds.get(0));
        }
        return awardRepository.findBySchoolIdInAndDeletedFalseOrderByIdDesc(scopedSchoolIds);
    }

    private List<Long> resolveSchoolIds(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return List.of(user.schoolId());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long effectiveHeadOfficeId = user.headOfficeId();
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, effectiveHeadOfficeId)) {
                throw new ForbiddenException();
            }
            if (requestedSchoolId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, effectiveHeadOfficeId);
                return List.of(requestedSchoolId);
            }
            return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(effectiveHeadOfficeId)
                    .stream()
                    .map(ManageSchool::getId)
                    .toList();
        }

        if (user.isSuperAdmin()) {
            if (requestedSchoolId != null && requestedHeadOfficeId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, requestedHeadOfficeId);
                return List.of(requestedSchoolId);
            }
            if (requestedSchoolId != null) {
                return List.of(requestedSchoolId);
            }
            if (requestedHeadOfficeId != null) {
                return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(requestedHeadOfficeId)
                        .stream()
                        .map(ManageSchool::getId)
                        .toList();
            }
            return null;
        }

        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return List.of(requestedSchoolId);
    }

    private void ensureUserCanRead(CurrentUser user, Long schoolId) {
        resolveSchoolIds(user, null, schoolId);
    }

    private void ensureUserCanWrite(CurrentUser user, Long schoolId) {
        resolveSchoolIds(user, null, schoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private Long resolveSchoolId(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolId;
    }

    private Long resolveHeadOfficeId(Long schoolId, Long requestedHeadOfficeId) {
        if (requestedHeadOfficeId != null) {
            return requestedHeadOfficeId;
        }
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getHeadOfficeId)
                .orElse(null);
    }

    private void applyDto(Award entity, AwardDto dto, Long schoolId, Long headOfficeId) {
        entity.setSchoolId(schoolId);
        entity.setHeadOfficeId(headOfficeId);
        entity.setSchoolName(resolveSchoolName(schoolId));
        entity.setUserType(normalizeRequired(dto.getUserType(), "User type is required"));
        entity.setWinnerId(dto.getWinnerId());
        entity.setWinnerName(resolveWinnerName(entity.getUserType(), dto.getWinnerId(), dto.getWinnerName(), schoolId));
        entity.setTitle(normalizeRequired(dto.getTitle(), "Title is required"));
        entity.setGift(normalizeOptional(dto.getGift()));
        entity.setPrice(dto.getPrice() != null ? dto.getPrice() : 0D);
        entity.setAwardDate(dto.getAwardDate() != null ? dto.getAwardDate() : LocalDate.now());
        entity.setNote(normalizeOptional(dto.getNote()));
    }

    private String resolveWinnerName(String userType, Long winnerId, String fallbackName, Long schoolId) {
        if (winnerId != null) {
            if (isStudentType(userType)) {
                Student student = studentRepository.findById(winnerId).orElseThrow(NotFoundException::new);
                if (student.getSchool() == null || !Objects.equals(student.getSchool().getId(), schoolId)) {
                    throw new BadRequestException("Winner student does not belong to the selected school");
                }
                return student.getName();
            }
            if (isEmployeeType(userType)) {
                Employee employee = employeeRepository.findById(winnerId).orElseThrow(NotFoundException::new);
                if (employee.getSchoolId() == null || !Objects.equals(employee.getSchoolId(), schoolId)) {
                    throw new BadRequestException("Winner employee does not belong to the selected school");
                }
                return employee.getName();
            }
        }

        String normalized = normalizeOptional(fallbackName);
        if (normalized == null) {
            throw new BadRequestException("Winner is required");
        }
        return normalized;
    }

    private boolean isStudentType(String userType) {
        String normalized = normalizeOptional(userType);
        return normalized != null && normalized.toLowerCase(Locale.ENGLISH).contains("student");
    }

    private boolean isEmployeeType(String userType) {
        String normalized = normalizeOptional(userType);
        if (normalized == null) return false;
        String lowered = normalized.toLowerCase(Locale.ENGLISH);
        return lowered.contains("staff") || lowered.contains("employee");
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

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Predicate<AwardDto> matches(String userType, String title, String gift, String search) {
        String normalizedSearch = search == null ? null : search.toLowerCase(Locale.ENGLISH);
        return dto -> {
            boolean matchesUserType = userType == null || safe(dto.getUserType()).equalsIgnoreCase(userType);
            boolean matchesTitle = title == null || safe(dto.getTitle()).toLowerCase(Locale.ENGLISH).contains(title.toLowerCase(Locale.ENGLISH));
            boolean matchesGift = gift == null || safe(dto.getGift()).toLowerCase(Locale.ENGLISH).contains(gift.toLowerCase(Locale.ENGLISH));
            boolean matchesSearch = normalizedSearch == null || String.join(" ",
                    safe(dto.getSchoolName()),
                    safe(dto.getUserType()),
                    safe(dto.getWinnerName()),
                    safe(dto.getTitle()),
                    safe(dto.getGift()),
                    safe(dto.getNote()),
                    safe(dto.getAwardDate() != null ? dto.getAwardDate().toString() : ""))
                    .toLowerCase(Locale.ENGLISH)
                    .contains(normalizedSearch);
            return matchesUserType && matchesTitle && matchesGift && matchesSearch;
        };
    }

    private Page<AwardDto> slice(List<AwardDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private AwardDto toDto(Award entity) {
        AwardDto dto = new AwardDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(entity.getSchoolName());
        dto.setUserType(entity.getUserType());
        dto.setWinnerId(entity.getWinnerId());
        dto.setWinnerName(entity.getWinnerName());
        dto.setTitle(entity.getTitle());
        dto.setGift(entity.getGift());
        dto.setPrice(entity.getPrice());
        dto.setAwardDate(entity.getAwardDate());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
