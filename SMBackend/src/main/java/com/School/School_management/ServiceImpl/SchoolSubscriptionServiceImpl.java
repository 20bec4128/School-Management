package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.SchoolSubscriptionDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.SchoolSubscription;
import com.School.School_management.Entity.SubscriptionPlan;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SchoolSubscriptionRepository;
import com.School.School_management.Repository.SubscriptionPlanRepository;
import com.School.School_management.Service.SchoolSubscriptionService;
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
public class SchoolSubscriptionServiceImpl implements SchoolSubscriptionService {
    private final SchoolSubscriptionRepository repository;
    private final SchoolRepository schoolRepository;
    private final SubscriptionPlanRepository planRepository;

    public SchoolSubscriptionServiceImpl(SchoolSubscriptionRepository repository, SchoolRepository schoolRepository, SubscriptionPlanRepository planRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
        this.planRepository = planRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SchoolSubscriptionDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        return fetchScopedRows(scopedSchoolIds).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SchoolSubscriptionDto> listPaginated(Long headOfficeId, Long schoolId, String status, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedStatus = normalizeOptional(status);
        String normalizedSearch = normalizeOptional(search);
        List<Long> scopedSchoolIds = resolveSchoolIds(user, headOfficeId, schoolId);
        List<SchoolSubscriptionDto> filtered = fetchScopedRows(scopedSchoolIds).stream()
                .map(this::toDto)
                .filter(matches(normalizedStatus, normalizedSearch))
                .collect(Collectors.toList());
        return slice(filtered, pageable);
    }

    @Override
    public SchoolSubscriptionDto create(SchoolSubscriptionDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        Long effectiveSchoolId = requireSchoolId(dto.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        SchoolSubscription entity = new SchoolSubscription();
        applyDto(entity, dto, effectiveSchoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public SchoolSubscriptionDto update(Long id, SchoolSubscriptionDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (dto == null) throw new BadRequestException("Request body is required");
        SchoolSubscription entity = repository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = requireSchoolId(dto.getSchoolId() != null ? dto.getSchoolId() : entity.getSchoolId());
        ensureUserCanWrite(user, effectiveSchoolId);
        applyDto(entity, dto, effectiveSchoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        SchoolSubscription entity = repository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        ensureUserCanRead(user, entity.getSchoolId());
        entity.setDeleted(true);
        repository.save(entity);
    }

    private List<SchoolSubscription> fetchScopedRows(List<Long> scopedSchoolIds) {
        if (scopedSchoolIds == null) return repository.findAllByDeletedFalseOrderByIdDesc();
        if (scopedSchoolIds.isEmpty()) return List.of();
        if (scopedSchoolIds.size() == 1) return repository.findBySchoolIdAndDeletedFalseOrderByIdDesc(scopedSchoolIds.get(0));
        return repository.findBySchoolIdInAndDeletedFalseOrderByIdDesc(scopedSchoolIds);
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

    private void applyDto(SchoolSubscription entity, SchoolSubscriptionDto dto, Long schoolId) {
        entity.setSchoolId(schoolId);
        entity.setSchoolName(resolveSchoolName(schoolId));
        entity.setHeadOfficeId(dto.getHeadOfficeId() != null ? dto.getHeadOfficeId() : resolveHeadOfficeId(schoolId));
        entity.setPlanId(dto.getPlanId());
        entity.setPlanName(resolvePlanName(dto.getPlanId(), dto.getPlanName()));
        entity.setPrice(dto.getPrice());
        entity.setName(normalizeRequired(dto.getName(), "Name is required"));
        entity.setEmail(normalizeOptional(dto.getEmail()));
        entity.setPhone(normalizeOptional(dto.getPhone()));
        entity.setAddress(normalizeOptional(dto.getAddress()));
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setStatus(normalizeOptional(dto.getStatus()) != null ? normalizeOptional(dto.getStatus()) : "Active");
    }

    private String resolvePlanName(Long planId, String fallback) {
        if (planId != null) {
            SubscriptionPlan plan = planRepository.findByIdAndDeletedFalse(planId).orElseThrow(NotFoundException::new);
            return plan.getPlanName();
        }
        String normalized = normalizeOptional(fallback);
        if (normalized == null) throw new BadRequestException("Plan name is required");
        return normalized;
    }
    private Long resolveHeadOfficeId(Long schoolId) { return schoolRepository.findByIdAndIsDeletedFalse(schoolId).map(ManageSchool::getHeadOfficeId).orElse(null); }
    private String resolveSchoolName(Long schoolId) { return schoolRepository.findByIdAndIsDeletedFalse(schoolId).map(ManageSchool::getSchoolName).orElse(null); }
    private String normalizeRequired(String value, String message) { if (value == null) throw new BadRequestException(message); String t = value.trim(); if (t.isEmpty()) throw new BadRequestException(message); return t; }
    private String normalizeOptional(String value) { if (value == null) return null; String t = value.trim(); return t.isEmpty() ? null : t; }
    private Predicate<SchoolSubscriptionDto> matches(String status, String search) {
        String normalizedSearch = search == null ? null : search.toLowerCase(Locale.ENGLISH);
        return dto -> {
            boolean matchesStatus = status == null || safe(dto.getStatus()).equalsIgnoreCase(status);
            boolean matchesSearch = normalizedSearch == null || String.join(" ", safe(dto.getSchoolName()), safe(dto.getPlanName()), safe(dto.getName()), safe(dto.getEmail()), safe(dto.getPhone()), safe(dto.getAddress()))
                    .toLowerCase(Locale.ENGLISH)
                    .contains(normalizedSearch);
            return matchesStatus && matchesSearch;
        };
    }
    private Page<SchoolSubscriptionDto> slice(List<SchoolSubscriptionDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }
    private SchoolSubscriptionDto toDto(SchoolSubscription entity) {
        SchoolSubscriptionDto dto = new SchoolSubscriptionDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(entity.getSchoolName());
        dto.setPlanId(entity.getPlanId());
        dto.setPlanName(entity.getPlanName());
        dto.setPrice(entity.getPrice());
        dto.setName(entity.getName());
        dto.setEmail(entity.getEmail());
        dto.setPhone(entity.getPhone());
        dto.setAddress(entity.getAddress());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
    private String safe(String value) { return value == null ? "" : value; }
}
