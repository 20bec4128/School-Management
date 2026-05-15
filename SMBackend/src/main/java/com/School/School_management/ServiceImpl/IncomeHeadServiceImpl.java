package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.IncomeHeadDto;
import com.School.School_management.Entity.IncomeHead;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.IncomeHeadRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.IncomeHeadService;
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
public class IncomeHeadServiceImpl implements IncomeHeadService {

    private final IncomeHeadRepository repository;
    private final SchoolRepository schoolRepository;

    public IncomeHeadServiceImpl(IncomeHeadRepository repository, SchoolRepository schoolRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncomeHeadDto> list(Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin() && schoolId == null) {
            return repository.findAllActiveWithDetailsOrderByIdDesc().stream().map(this::toDto).collect(Collectors.toList());
        }
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return repository.findBySchoolIdActiveWithDetailsOrderByIdDesc(effectiveSchoolId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<IncomeHeadDto> listPaginated(Long schoolId, int page, int size, String search) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = normalizeOptional(search);
        if (user.isSuperAdmin() && schoolId == null) {
            return repository.findPageWithDetails(null, normalizedSearch, pageable).map(this::toDto);
        }
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return repository.findPageWithDetails(effectiveSchoolId, normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    public IncomeHeadDto create(IncomeHeadDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        IncomeHead entity = new IncomeHead();
        entity.setSchool(resolveSchool(effectiveSchoolId));
        entity.setIncomeHead(normalizeRequired(dto == null ? null : dto.getIncomeHead(), "Income head is required"));
        entity.setNote(normalizeOptional(dto == null ? null : dto.getNote()));
        return toDto(repository.save(entity));
    }

    @Override
    public IncomeHeadDto update(Long id, IncomeHeadDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        IncomeHead entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        entity.setSchool(resolveSchool(effectiveSchoolId));
        entity.setIncomeHead(normalizeRequired(dto == null ? null : dto.getIncomeHead(), "Income head is required"));
        entity.setNote(normalizeOptional(dto == null ? null : dto.getNote()));
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        IncomeHead entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        entity.setDeleted(true);
        repository.save(entity);
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
        return effectiveSchoolIdForRead(user, requestedSchoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        if (!schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent()) {
            throw new NotFoundException();
        }
    }

    private ManageSchool resolveSchool(Long schoolId) {
        return schoolRepository.findById(schoolId).orElseThrow(NotFoundException::new);
    }

    private IncomeHeadDto toDto(IncomeHead entity) {
        IncomeHeadDto dto = new IncomeHeadDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool() == null ? null : entity.getSchool().getId());
        dto.setSchoolName(entity.getSchool() == null ? null : entity.getSchool().getSchoolName());
        dto.setIncomeHead(entity.getIncomeHead());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
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
}
