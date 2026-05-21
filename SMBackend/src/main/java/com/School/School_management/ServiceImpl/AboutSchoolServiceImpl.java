package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.AboutSchoolDto;
import com.School.School_management.Entity.AboutSchool;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.AboutSchoolRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.AboutSchoolService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
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
public class AboutSchoolServiceImpl implements AboutSchoolService {
    private final AboutSchoolRepository aboutSchoolRepository;
    private final SchoolRepository schoolRepository;

    public AboutSchoolServiceImpl(AboutSchoolRepository aboutSchoolRepository, SchoolRepository schoolRepository) {
        this.aboutSchoolRepository = aboutSchoolRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AboutSchoolDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        return fetchScopedRows(scopedSchoolIds).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AboutSchoolDto> listPaginated(Long headOfficeId, Long schoolId, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = normalizeOptional(search);
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        List<AboutSchoolDto> filtered = fetchScopedRows(scopedSchoolIds).stream()
                .map(this::toDto)
                .filter(matches(normalizedSearch))
                .collect(Collectors.toList());
        return slice(filtered, pageable);
    }

    @Override
    public AboutSchoolDto create(AboutSchoolDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        Long effectiveSchoolId = requireSchoolId(dto.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);

        if (aboutSchoolRepository.existsBySchoolIdAndDeletedFalse(effectiveSchoolId)) {
            throw new BadRequestException("An About School record already exists for the selected school.");
        }

        AboutSchool entity = new AboutSchool();
        applyDto(entity, dto, effectiveSchoolId);
        return toDto(aboutSchoolRepository.save(entity));
    }

    @Override
    public AboutSchoolDto update(Long id, AboutSchoolDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        AboutSchool entity = aboutSchoolRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = requireSchoolId(dto.getSchoolId() != null ? dto.getSchoolId() : entity.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);

        if (aboutSchoolRepository.existsBySchoolIdAndDeletedFalseAndIdNot(effectiveSchoolId, id)) {
            throw new BadRequestException("An About School record already exists for the selected school.");
        }

        applyDto(entity, dto, effectiveSchoolId);
        return toDto(aboutSchoolRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        AboutSchool entity = aboutSchoolRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        ensureUserCanRead(user, entity.getSchoolId());
        entity.setDeleted(true);
        aboutSchoolRepository.save(entity);
    }

    private List<AboutSchool> fetchScopedRows(List<Long> scopedSchoolIds) {
        if (scopedSchoolIds == null) return aboutSchoolRepository.findAllByDeletedFalseOrderByIdDesc();
        if (scopedSchoolIds.isEmpty()) return List.of();
        if (scopedSchoolIds.size() == 1) return aboutSchoolRepository.findBySchoolIdAndDeletedFalseOrderByIdDesc(scopedSchoolIds.get(0));
        return aboutSchoolRepository.findBySchoolIdInAndDeletedFalseOrderByIdDesc(scopedSchoolIds);
    }

    private List<Long> resolveSchoolIds(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return List.of(user.schoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            Long effectiveHeadOfficeId = user.headOfficeId();
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, effectiveHeadOfficeId)) throw new ForbiddenException();
            if (requestedSchoolId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, effectiveHeadOfficeId);
                return List.of(requestedSchoolId);
            }
            return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(effectiveHeadOfficeId).stream().map(ManageSchool::getId).toList();
        }
        if (user.isSuperAdmin()) {
            if (requestedSchoolId != null && requestedHeadOfficeId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, requestedHeadOfficeId);
                return List.of(requestedSchoolId);
            }
            if (requestedSchoolId != null) return List.of(requestedSchoolId);
            if (requestedHeadOfficeId != null) {
                return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(requestedHeadOfficeId).stream().map(ManageSchool::getId).toList();
            }
            return null;
        }
        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return List.of(requestedSchoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        if (schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isEmpty()) throw new NotFoundException();
    }

    private void ensureUserCanRead(CurrentUser user, Long schoolId) { resolveSchoolIds(user, null, schoolId); }
    private void ensureUserCanWrite(CurrentUser user, Long schoolId) { resolveSchoolIds(user, null, schoolId); }
    private Long requireSchoolId(Long schoolId) { if (schoolId == null) throw new BadRequestException("schoolId is required"); return schoolId; }

    private void applyDto(AboutSchool entity, AboutSchoolDto dto, Long schoolId) {
        entity.setSchoolId(schoolId);
        entity.setSchoolName(resolveSchoolName(schoolId));
        entity.setHeadOfficeId(dto.getHeadOfficeId() != null ? dto.getHeadOfficeId() : resolveHeadOfficeId(schoolId));
        entity.setAboutText(normalizeRequired(dto.getAboutText(), "About School text is required"));
        entity.setImage(normalizeOptional(dto.getImage()));
    }

    private Long resolveHeadOfficeId(Long schoolId) {
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).map(ManageSchool::getHeadOfficeId).orElse(null);
    }

    private String resolveSchoolName(Long schoolId) {
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).map(ManageSchool::getSchoolName).orElse(null);
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

    private Predicate<AboutSchoolDto> matches(String search) {
        String normalizedSearch = search == null ? null : search.toLowerCase(Locale.ENGLISH);
        return dto -> {
            boolean matchesSearch = normalizedSearch == null || String.join(" ", safe(dto.getSchoolName()), safe(dto.getAboutText()))
                    .toLowerCase(Locale.ENGLISH)
                    .contains(normalizedSearch);
            return matchesSearch;
        };
    }

    private Page<AboutSchoolDto> slice(List<AboutSchoolDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private AboutSchoolDto toDto(AboutSchool entity) {
        AboutSchoolDto dto = new AboutSchoolDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(entity.getSchoolName());
        dto.setAboutText(entity.getAboutText());
        dto.setImage(entity.getImage());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private String safe(String value) { return value == null ? "" : value; }
}
