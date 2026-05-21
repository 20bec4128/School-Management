package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.FrontendPageDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.FrontendPage;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.FrontendPageRepository;
import com.School.School_management.Service.FrontendPageService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
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
public class FrontendPageServiceImpl implements FrontendPageService {
    private final FrontendPageRepository frontendPageRepository;
    private final SchoolRepository schoolRepository;

    public FrontendPageServiceImpl(FrontendPageRepository frontendPageRepository, SchoolRepository schoolRepository) {
        this.frontendPageRepository = frontendPageRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FrontendPageDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        return fetchScopedRows(scopedSchoolIds).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FrontendPageDto> listPaginated(Long headOfficeId, Long schoolId, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = normalizeOptional(search);
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        List<FrontendPageDto> filtered = fetchScopedRows(scopedSchoolIds).stream()
                .map(this::toDto)
                .filter(matches(normalizedSearch))
                .collect(Collectors.toList());
        return slice(filtered, pageable);
    }

    @Override
    public FrontendPageDto create(FrontendPageDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        Long effectiveSchoolId = requireSchoolId(dto.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        
        String normalizedSlug = normalizeSlug(dto.getUrlSlug());
        if (frontendPageRepository.existsBySchoolIdAndUrlSlugAndDeletedFalse(effectiveSchoolId, normalizedSlug)) {
            throw new BadRequestException("URL Slug must be unique per school");
        }

        FrontendPage entity = new FrontendPage();
        applyDto(entity, dto, effectiveSchoolId, normalizedSlug);
        return toDto(frontendPageRepository.save(entity));
    }

    @Override
    public FrontendPageDto update(Long id, FrontendPageDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        FrontendPage entity = frontendPageRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = requireSchoolId(dto.getSchoolId() != null ? dto.getSchoolId() : entity.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        
        String normalizedSlug = normalizeSlug(dto.getUrlSlug() != null ? dto.getUrlSlug() : entity.getUrlSlug());
        if (frontendPageRepository.existsBySchoolIdAndUrlSlugAndIdNotAndDeletedFalse(effectiveSchoolId, normalizedSlug, id)) {
            throw new BadRequestException("URL Slug must be unique per school");
        }

        applyDto(entity, dto, effectiveSchoolId, normalizedSlug);
        return toDto(frontendPageRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        FrontendPage entity = frontendPageRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        ensureUserCanRead(user, entity.getSchoolId());
        entity.setDeleted(true);
        frontendPageRepository.save(entity);
    }

    private List<FrontendPage> fetchScopedRows(List<Long> scopedSchoolIds) {
        if (scopedSchoolIds == null) return frontendPageRepository.findAllByDeletedFalseOrderByIdDesc();
        if (scopedSchoolIds.isEmpty()) return List.of();
        if (scopedSchoolIds.size() == 1) return frontendPageRepository.findBySchoolIdAndDeletedFalseOrderByIdDesc(scopedSchoolIds.get(0));
        return frontendPageRepository.findBySchoolIdInAndDeletedFalseOrderByIdDesc(scopedSchoolIds);
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

    private void applyDto(FrontendPage entity, FrontendPageDto dto, Long schoolId, String slug) {
        entity.setSchoolId(schoolId);
        entity.setSchoolName(resolveSchoolName(schoolId));
        entity.setHeadOfficeId(dto.getHeadOfficeId() != null ? dto.getHeadOfficeId() : resolveHeadOfficeId(schoolId));
        entity.setLocation(normalizeRequired(dto.getLocation(), "Location is required"));
        entity.setTitle(normalizeRequired(dto.getTitle(), "Title is required"));
        entity.setUrlSlug(slug);
        entity.setDescription(normalizeOptional(dto.getDescription()));
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

    private String normalizeSlug(String value) {
        if (value == null) throw new BadRequestException("Url Slug is required");
        String trimmed = value.trim().toLowerCase(Locale.ENGLISH).replaceAll("[^a-z0-9\\-]+", "-").replaceAll("^-+|-+$", "");
        if (trimmed.isEmpty()) throw new BadRequestException("Url Slug is required");
        return trimmed;
    }

    private Predicate<FrontendPageDto> matches(String search) {
        String normalizedSearch = search == null ? null : search.toLowerCase(Locale.ENGLISH);
        return dto -> {
            return normalizedSearch == null || String.join(" ", safe(dto.getSchoolName()), safe(dto.getTitle()), safe(dto.getLocation()), safe(dto.getUrlSlug()))
                    .toLowerCase(Locale.ENGLISH)
                    .contains(normalizedSearch);
        };
    }

    private Page<FrontendPageDto> slice(List<FrontendPageDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private FrontendPageDto toDto(FrontendPage entity) {
        FrontendPageDto dto = new FrontendPageDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(entity.getSchoolName());
        dto.setLocation(entity.getLocation());
        dto.setTitle(entity.getTitle());
        dto.setUrlSlug(entity.getUrlSlug());
        dto.setDescription(entity.getDescription());
        dto.setImage(entity.getImage());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private String safe(String value) { return value == null ? "" : value; }
}
