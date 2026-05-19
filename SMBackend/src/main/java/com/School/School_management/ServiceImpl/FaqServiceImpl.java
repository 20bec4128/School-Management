package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.FaqDto;
import com.School.School_management.Entity.Faq;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.FaqRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.FaqService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
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
public class FaqServiceImpl implements FaqService {

    private final FaqRepository faqRepository;
    private final SchoolRepository schoolRepository;

    public FaqServiceImpl(FaqRepository faqRepository, SchoolRepository schoolRepository) {
        this.faqRepository = faqRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FaqDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        return fetchScopedRows(scopedSchoolIds).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FaqDto> listPaginated(Long headOfficeId, Long schoolId, String title, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedTitle = normalizeOptional(title);
        String normalizedSearch = normalizeOptional(search);
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        List<FaqDto> filtered = fetchScopedRows(scopedSchoolIds).stream()
                .map(this::toDto)
                .filter(matches(normalizedTitle, normalizedSearch))
                .collect(Collectors.toList());
        return slice(filtered, pageable);
    }

    @Override
    public FaqDto create(FaqDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        Long effectiveSchoolId = resolveSchoolId(dto.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        Faq entity = new Faq();
        applyDto(entity, dto, effectiveSchoolId);
        return toDto(faqRepository.save(entity));
    }

    @Override
    public FaqDto update(Long id, FaqDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        Faq entity = faqRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = resolveSchoolId(dto.getSchoolId() != null ? dto.getSchoolId() : entity.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        applyDto(entity, dto, effectiveSchoolId);
        return toDto(faqRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Faq entity = faqRepository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        ensureUserCanRead(user, entity.getSchoolId());
        entity.setDeleted(true);
        faqRepository.save(entity);
    }

    private List<Faq> fetchScopedRows(List<Long> scopedSchoolIds) {
        if (scopedSchoolIds == null) return faqRepository.findAllByDeletedFalseOrderByIdDesc();
        if (scopedSchoolIds.isEmpty()) return List.of();
        if (scopedSchoolIds.size() == 1) return faqRepository.findBySchoolIdAndDeletedFalseOrderByIdDesc(scopedSchoolIds.get(0));
        return faqRepository.findBySchoolIdInAndDeletedFalseOrderByIdDesc(scopedSchoolIds);
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
        boolean ok = schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent();
        if (!ok) throw new NotFoundException();
    }

    private void ensureUserCanRead(CurrentUser user, Long schoolId) { resolveSchoolIds(user, null, schoolId); }
    private void ensureUserCanWrite(CurrentUser user, Long schoolId) { resolveSchoolIds(user, null, schoolId); }

    private Long resolveSchoolId(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolId;
    }

    private void applyDto(Faq entity, FaqDto dto, Long schoolId) {
        entity.setSchoolId(schoolId);
        entity.setSchoolName(resolveSchoolName(schoolId));
        entity.setHeadOfficeId(dto.getHeadOfficeId() != null ? dto.getHeadOfficeId() : resolveHeadOfficeId(schoolId));
        entity.setTitle(normalizeRequired(dto.getTitle(), "Title is required"));
        entity.setDescription(normalizeRequired(dto.getDescription(), "Description is required"));
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

    private Predicate<FaqDto> matches(String title, String search) {
        String normalizedSearch = search == null ? null : search.toLowerCase();
        return dto -> {
            boolean matchesTitle = title == null || safe(dto.getTitle()).toLowerCase().contains(title.toLowerCase());
            boolean matchesSearch = normalizedSearch == null || String.join(" ", safe(dto.getSchoolName()), safe(dto.getTitle()), safe(dto.getDescription()))
                    .toLowerCase()
                    .contains(normalizedSearch);
            return matchesTitle && matchesSearch;
        };
    }

    private Page<FaqDto> slice(List<FaqDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private FaqDto toDto(Faq entity) {
        FaqDto dto = new FaqDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(entity.getSchoolName());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private String safe(String value) { return value == null ? "" : value; }
}
