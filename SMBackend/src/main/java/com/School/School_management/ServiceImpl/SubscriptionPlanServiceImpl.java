package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.SubscriptionPlanDto;
import com.School.School_management.Entity.SubscriptionPlan;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.SubscriptionPlanRepository;
import com.School.School_management.Service.SubscriptionPlanService;
import java.util.List;
import java.util.Locale;
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
public class SubscriptionPlanServiceImpl implements SubscriptionPlanService {
    private final SubscriptionPlanRepository repository;
    public SubscriptionPlanServiceImpl(SubscriptionPlanRepository repository) { this.repository = repository; }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlanDto> list() {
        return repository.findAllByDeletedFalseOrderByIdDesc().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SubscriptionPlanDto> listPaginated(String status, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedStatus = normalizeOptional(status);
        String normalizedSearch = normalizeOptional(search);
        List<SubscriptionPlanDto> filtered = repository.findAllByDeletedFalseOrderByIdDesc().stream()
                .map(this::toDto)
                .filter(matches(normalizedStatus, normalizedSearch))
                .collect(Collectors.toList());
        return slice(filtered, pageable);
    }

    @Override
    public SubscriptionPlanDto create(SubscriptionPlanDto dto) {
        if (dto == null) throw new BadRequestException("Request body is required");
        SubscriptionPlan entity = new SubscriptionPlan();
        applyDto(entity, dto);
        return toDto(repository.save(entity));
    }

    @Override
    public SubscriptionPlanDto update(Long id, SubscriptionPlanDto dto) {
        if (dto == null) throw new BadRequestException("Request body is required");
        SubscriptionPlan entity = repository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        applyDto(entity, dto);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        SubscriptionPlan entity = repository.findByIdAndDeletedFalse(id).orElseThrow(NotFoundException::new);
        entity.setDeleted(true);
        repository.save(entity);
    }

    private void applyDto(SubscriptionPlan entity, SubscriptionPlanDto dto) {
        entity.setPlanName(normalizeRequired(dto.getPlanName(), "Plan name is required"));
        entity.setPrice(dto.getPrice());
        entity.setStudentLimit(normalizeOptional(dto.getStudentLimit()));
        entity.setGuardianLimit(normalizeOptional(dto.getGuardianLimit()));
        entity.setTeacherLimit(normalizeOptional(dto.getTeacherLimit()));
        entity.setEmployeeLimit(normalizeOptional(dto.getEmployeeLimit()));
        entity.setStatus(normalizeOptional(dto.getStatus()) != null ? normalizeOptional(dto.getStatus()) : "Active");
    }
    private String normalizeRequired(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) throw new BadRequestException(message);
        return trimmed;
    }
    private String normalizeOptional(String value) { if (value == null) return null; String trimmed = value.trim(); return trimmed.isEmpty() ? null : trimmed; }
    private Predicate<SubscriptionPlanDto> matches(String status, String search) {
        String normalizedSearch = search == null ? null : search.toLowerCase(Locale.ENGLISH);
        return dto -> {
            boolean matchesStatus = status == null || safe(dto.getStatus()).equalsIgnoreCase(status);
            boolean matchesSearch = normalizedSearch == null || String.join(" ", safe(dto.getPlanName()), safe(dto.getStatus()), safe(dto.getPrice() != null ? dto.getPrice().toString() : ""), safe(dto.getStudentLimit()), safe(dto.getGuardianLimit()), safe(dto.getTeacherLimit()), safe(dto.getEmployeeLimit()))
                    .toLowerCase(Locale.ENGLISH)
                    .contains(normalizedSearch);
            return matchesStatus && matchesSearch;
        };
    }
    private Page<SubscriptionPlanDto> slice(List<SubscriptionPlanDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }
    private SubscriptionPlanDto toDto(SubscriptionPlan entity) {
        SubscriptionPlanDto dto = new SubscriptionPlanDto();
        dto.setId(entity.getId());
        dto.setPlanName(entity.getPlanName());
        dto.setPrice(entity.getPrice());
        dto.setStudentLimit(entity.getStudentLimit());
        dto.setGuardianLimit(entity.getGuardianLimit());
        dto.setTeacherLimit(entity.getTeacherLimit());
        dto.setEmployeeLimit(entity.getEmployeeLimit());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
    private String safe(String value) { return value == null ? "" : value; }
}
