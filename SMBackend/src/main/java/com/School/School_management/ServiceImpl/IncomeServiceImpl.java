package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.IncomeDto;
import com.School.School_management.Entity.Income;
import com.School.School_management.Entity.IncomeHead;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.IncomeHeadRepository;
import com.School.School_management.Repository.IncomeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.IncomeService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class IncomeServiceImpl implements IncomeService {

    private final IncomeRepository repository;
    private final IncomeHeadRepository incomeHeadRepository;
    private final SchoolRepository schoolRepository;

    public IncomeServiceImpl(IncomeRepository repository, IncomeHeadRepository incomeHeadRepository, SchoolRepository schoolRepository) {
        this.repository = repository;
        this.incomeHeadRepository = incomeHeadRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncomeDto> list(Long schoolId) {
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
    public Page<IncomeDto> listPaginated(Long schoolId, Long incomeHeadId, String incomeMethod, int page, int size, String search) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = normalizeOptional(search);
        String normalizedMethod = normalizeOptional(incomeMethod);
        if (user.isSuperAdmin() && schoolId == null) {
            return repository.findPageWithDetails(null, incomeHeadId, normalizedMethod, normalizedSearch, pageable).map(this::toDto);
        }
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return repository.findPageWithDetails(effectiveSchoolId, incomeHeadId, normalizedMethod, normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    public IncomeDto create(IncomeDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        IncomeHead incomeHead = resolveIncomeHead(dto == null ? null : dto.getIncomeHeadId(), effectiveSchoolId);
        Income entity = new Income();
        entity.setSchool(resolveSchool(effectiveSchoolId));
        entity.setIncomeHead(incomeHead);
        entity.setIncomeMethod(normalizeRequired(dto == null ? null : dto.getIncomeMethod(), "Income method is required"));
        entity.setAmount(dto == null ? null : dto.getAmount());
        entity.setIncomeDate(dto == null ? null : dto.getIncomeDate());
        entity.setNote(normalizeOptional(dto == null ? null : dto.getNote()));
        return toDto(repository.save(entity));
    }

    @Override
    public IncomeDto update(Long id, IncomeDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Income entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        entity.setSchool(resolveSchool(effectiveSchoolId));
        entity.setIncomeHead(resolveIncomeHead(dto == null ? null : dto.getIncomeHeadId(), effectiveSchoolId));
        entity.setIncomeMethod(normalizeRequired(dto == null ? null : dto.getIncomeMethod(), "Income method is required"));
        entity.setAmount(dto == null ? null : dto.getAmount());
        entity.setIncomeDate(dto == null ? null : dto.getIncomeDate());
        entity.setNote(normalizeOptional(dto == null ? null : dto.getNote()));
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Income entity = repository.findById(id).orElseThrow(NotFoundException::new);
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

    private IncomeHead resolveIncomeHead(Long incomeHeadId, Long schoolId) {
        if (incomeHeadId == null) throw new BadRequestException("Income head is required");
        IncomeHead incomeHead = incomeHeadRepository.findById(incomeHeadId).orElseThrow(NotFoundException::new);
        if (!Objects.equals(incomeHead.getSchool().getId(), schoolId)) throw new ForbiddenException();
        return incomeHead;
    }

    private IncomeDto toDto(Income entity) {
        IncomeDto dto = new IncomeDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool() == null ? null : entity.getSchool().getId());
        dto.setSchoolName(entity.getSchool() == null ? null : entity.getSchool().getSchoolName());
        dto.setIncomeHeadId(entity.getIncomeHead() == null ? null : entity.getIncomeHead().getId());
        dto.setIncomeHeadName(entity.getIncomeHead() == null ? null : entity.getIncomeHead().getIncomeHead());
        dto.setIncomeMethod(entity.getIncomeMethod());
        dto.setAmount(entity.getAmount());
        dto.setIncomeDate(entity.getIncomeDate());
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
