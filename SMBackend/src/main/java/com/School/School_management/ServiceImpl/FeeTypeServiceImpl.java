package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.FeeTypeDto;
import com.School.School_management.Entity.FeeType;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.FeeTypeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.FeeTypeService;
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
public class FeeTypeServiceImpl implements FeeTypeService {

    private final FeeTypeRepository feeTypeRepository;
    private final SchoolRepository schoolRepository;

    public FeeTypeServiceImpl(FeeTypeRepository feeTypeRepository, SchoolRepository schoolRepository) {
        this.feeTypeRepository = feeTypeRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeTypeDto> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin() && schoolId == null) {
            return feeTypeRepository.findAllByOrderByIdDesc()
                    .stream().map(this::toDto).collect(Collectors.toList());
        }
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return feeTypeRepository.findBySchoolIdOrderByIdDesc(effectiveSchoolId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeeTypeDto> listPaginated(Long schoolId, int page, int size, String search) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();

        if (user.isSuperAdmin() && schoolId == null) {
            List<FeeTypeDto> rows = feeTypeRepository.findAllByOrderByIdDesc()
                    .stream().map(this::toDto)
                    .filter(dto -> {
                        if (normalizedSearch == null) return true;
                        return matchesSearch(dto, normalizedSearch);
                    }).toList();
            return slice(rows, pageable);
        }

        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        List<FeeTypeDto> rows = feeTypeRepository.findBySchoolIdOrderByIdDesc(effectiveSchoolId)
                .stream()
                .map(this::toDto)
                .filter(dto -> normalizedSearch == null || matchesSearch(dto, normalizedSearch))
                .toList();
        return slice(rows, pageable);
    }

    @Override
    public FeeTypeDto create(FeeTypeDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        String feeType  = normalizeRequired(dto == null ? null : dto.getFeeType(),  "Fee type is required");
        String title    = normalizeRequired(dto == null ? null : dto.getTitle(),     "Title is required");

        if (hasDuplicateTitle(effectiveSchoolId, title, feeType, null)) {
            throw new ConflictException("A fee type with this title already exists for this school");
        }

        FeeType entity = new FeeType();
        entity.setSchoolId(effectiveSchoolId);
        entity.setFeeType(feeType);
        entity.setTitle(title);
        entity.setNote(normalizeOptional(dto.getNote()));
        return toDto(feeTypeRepository.save(entity));
    }

    @Override
    public FeeTypeDto update(Long id, FeeTypeDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        FeeType entity = feeTypeRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }

        String feeType = normalizeRequired(dto == null ? null : dto.getFeeType(), "Fee type is required");
        String title   = normalizeRequired(dto == null ? null : dto.getTitle(),   "Title is required");

        if (hasDuplicateTitle(effectiveSchoolId, title, feeType, id)) {
            throw new ConflictException("A fee type with this title already exists for this school");
        }

        entity.setSchoolId(effectiveSchoolId);
        entity.setFeeType(feeType);
        entity.setTitle(title);
        entity.setNote(normalizeOptional(dto.getNote()));
        return toDto(feeTypeRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        FeeType entity = feeTypeRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        feeTypeRepository.delete(entity);
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
        if (!schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent()) {
            throw new NotFoundException();
        }
    }

    private FeeTypeDto toDto(FeeType entity) {
        FeeTypeDto dto = new FeeTypeDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setFeeType(entity.getFeeType());
        dto.setTitle(entity.getTitle());
        dto.setNote(entity.getNote());
        return dto;
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName).orElse(null);
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

    private Page<FeeTypeDto> slice(List<FeeTypeDto> rows, Pageable pageable) {
        int start = Math.min(pageable.getPageNumber() * pageable.getPageSize(), rows.size());
        int end   = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }

    private boolean matchesSearch(FeeTypeDto dto, String search) {
        String haystack = String.join(" ",
                safe(dto.getSchoolName()),
                safe(dto.getFeeType()),
                safe(dto.getTitle()),
                safe(dto.getNote())).toLowerCase();
        return haystack.contains(search.toLowerCase());
    }

    private boolean hasDuplicateTitle(Long schoolId, String title, String feeType, Long excludeId) {
        String normalizedTitle = normalizeRequired(title, "Title is required");
        String normalizedFeeType = normalizeRequired(feeType, "Fee type is required");
        return feeTypeRepository.findBySchoolIdOrderByIdDesc(schoolId)
                .stream()
                .filter(dto -> excludeId == null || !Objects.equals(dto.getId(), excludeId))
                .anyMatch(dto ->
                        dto.getTitle() != null && dto.getFeeType() != null
                                && dto.getTitle().trim().equalsIgnoreCase(normalizedTitle)
                                && dto.getFeeType().trim().equalsIgnoreCase(normalizedFeeType));
    }

    private String safe(String value) { return value == null ? "" : value; }
}
