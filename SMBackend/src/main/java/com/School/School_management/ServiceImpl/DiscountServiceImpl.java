package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.DiscountDto;
import com.School.School_management.Entity.Discount;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.DiscountRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.DiscountService;
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
public class DiscountServiceImpl implements DiscountService {

    private final DiscountRepository discountRepository;
    private final SchoolRepository schoolRepository;

    public DiscountServiceImpl(DiscountRepository discountRepository, SchoolRepository schoolRepository) {
        this.discountRepository = discountRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiscountDto> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin() && schoolId == null) {
            return discountRepository.findAllByOrderByIdDesc()
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        }

        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return discountRepository.findBySchoolIdOrderByIdDesc(effectiveSchoolId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DiscountDto> listPaginated(Long schoolId, int page, int size, String search) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();

        if (user.isSuperAdmin() && schoolId == null) {
            List<DiscountDto> rows = discountRepository.findAllByOrderByIdDesc()
                    .stream()
                    .map(this::toDto)
                    .filter(dto -> {
                        if (normalizedSearch == null) return true;
                        return matchesSearch(dto, normalizedSearch);
                    })
                    .toList();
            return slice(rows, pageable);
        }

        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        List<DiscountDto> rows = discountRepository.findBySchoolIdOrderByIdDesc(effectiveSchoolId)
                .stream()
                .map(this::toDto)
                .filter(dto -> normalizedSearch == null || matchesSearch(dto, normalizedSearch))
                .toList();
        return slice(rows, pageable);
    }

    @Override
    public DiscountDto create(DiscountDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        String title = normalizeRequired(dto == null ? null : dto.getTitle(), "Discount title is required");
        String discountType = normalizeRequired(dto == null ? null : dto.getDiscountType(), "Discount type is required");
        if (dto == null || dto.getAmount() == null) throw new BadRequestException("Discount amount is required");

        if (hasDuplicateTitle(effectiveSchoolId, title, null)) {
            throw new ConflictException("Discount with this title already exists for this school");
        }

        Discount entity = new Discount();
        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(title);
        entity.setDiscountType(discountType);
        entity.setAmount(dto.getAmount());
        entity.setNote(normalizeOptional(dto.getNote()));
        
        return toDto(discountRepository.save(entity));
    }

    @Override
    public DiscountDto update(Long id, DiscountDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Discount entity = discountRepository.findById(id).orElseThrow(NotFoundException::new);

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        String title = normalizeRequired(dto == null ? null : dto.getTitle(), "Discount title is required");
        String discountType = normalizeRequired(dto == null ? null : dto.getDiscountType(), "Discount type is required");
        if (dto == null || dto.getAmount() == null) throw new BadRequestException("Discount amount is required");

        if (hasDuplicateTitle(effectiveSchoolId, title, id)) {
            throw new ConflictException("Discount with this title already exists for this school");
        }

        entity.setSchoolId(effectiveSchoolId);
        entity.setTitle(title);
        entity.setDiscountType(discountType);
        entity.setAmount(dto.getAmount());
        entity.setNote(normalizeOptional(dto.getNote()));
        
        return toDto(discountRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Discount entity = discountRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        discountRepository.delete(entity);
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

    private DiscountDto toDto(Discount entity) {
        DiscountDto dto = new DiscountDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setTitle(entity.getTitle());
        dto.setDiscountType(entity.getDiscountType());
        dto.setAmount(entity.getAmount());
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

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Page<DiscountDto> slice(List<DiscountDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private boolean matchesSearch(DiscountDto dto, String search) {
        String haystack = String.join(" ",
                safe(dto.getSchoolName()),
                safe(dto.getTitle()),
                safe(dto.getDiscountType()),
                safe(dto.getNote()))
                .toLowerCase();
        return haystack.contains(search.toLowerCase());
    }

    private boolean hasDuplicateTitle(Long schoolId, String title, Long excludeId) {
        String normalizedTitle = normalizeRequired(title, "Discount title is required");
        return discountRepository.findBySchoolIdOrderByIdDesc(schoolId)
                .stream()
                .filter(dto -> excludeId == null || !Objects.equals(dto.getId(), excludeId))
                .anyMatch(dto -> dto.getTitle() != null && dto.getTitle().trim().equalsIgnoreCase(normalizedTitle));
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
