package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.ExpenditureDto;
import com.School.School_management.Entity.Expenditure;
import com.School.School_management.Entity.ExpenditureHead;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.ExpenditureHeadRepository;
import com.School.School_management.Repository.ExpenditureRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.ExpenditureService;
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
public class ExpenditureServiceImpl implements ExpenditureService {

    private final ExpenditureRepository repository;
    private final ExpenditureHeadRepository expenditureHeadRepository;
    private final SchoolRepository schoolRepository;

    public ExpenditureServiceImpl(ExpenditureRepository repository, ExpenditureHeadRepository expenditureHeadRepository, SchoolRepository schoolRepository) {
        this.repository = repository;
        this.expenditureHeadRepository = expenditureHeadRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenditureDto> list(Long schoolId) {
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
    public Page<ExpenditureDto> listPaginated(
            Long schoolId,
            Long expenditureHeadId,
            String expenditureMethod,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size,
            String search
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = normalizeOptional(search);
        String normalizedMethod = normalizeOptional(expenditureMethod);
        if (user.isSuperAdmin() && schoolId == null) {
            return repository.findPageWithDetails(null, expenditureHeadId, normalizedMethod, startDate, endDate, normalizedSearch, pageable).map(this::toDto);
        }
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        return repository.findPageWithDetails(effectiveSchoolId, expenditureHeadId, normalizedMethod, startDate, endDate, normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    public ExpenditureDto create(ExpenditureDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        ExpenditureHead head = resolveExpenditureHead(dto == null ? null : dto.getExpenditureHeadId(), effectiveSchoolId);
        Expenditure entity = new Expenditure();
        entity.setSchool(resolveSchool(effectiveSchoolId));
        entity.setExpenditureHead(head);
        entity.setExpenditureMethod(normalizeRequired(dto == null ? null : dto.getExpenditureMethod(), "Expenditure method is required"));
        entity.setReference(normalizeOptional(dto == null ? null : dto.getReference()));
        entity.setAmount(dto == null ? null : dto.getAmount());
        entity.setExpenditureDate(dto == null ? null : dto.getExpenditureDate());
        entity.setNote(normalizeOptional(dto == null ? null : dto.getNote()));
        return toDto(repository.save(entity));
    }

    @Override
    public ExpenditureDto update(Long id, ExpenditureDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Expenditure entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchool().getId(), effectiveSchoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        entity.setSchool(resolveSchool(effectiveSchoolId));
        entity.setExpenditureHead(resolveExpenditureHead(dto == null ? null : dto.getExpenditureHeadId(), effectiveSchoolId));
        entity.setExpenditureMethod(normalizeRequired(dto == null ? null : dto.getExpenditureMethod(), "Expenditure method is required"));
        entity.setReference(normalizeOptional(dto == null ? null : dto.getReference()));
        entity.setAmount(dto == null ? null : dto.getAmount());
        entity.setExpenditureDate(dto == null ? null : dto.getExpenditureDate());
        entity.setNote(normalizeOptional(dto == null ? null : dto.getNote()));
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Expenditure entity = repository.findById(id).orElseThrow(NotFoundException::new);
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

    private ExpenditureHead resolveExpenditureHead(Long expenditureHeadId, Long schoolId) {
        if (expenditureHeadId == null) throw new BadRequestException("Expenditure head is required");
        ExpenditureHead head = expenditureHeadRepository.findById(expenditureHeadId).orElseThrow(NotFoundException::new);
        if (!Objects.equals(head.getSchool().getId(), schoolId)) throw new ForbiddenException();
        return head;
    }

    private ExpenditureDto toDto(Expenditure entity) {
        ExpenditureDto dto = new ExpenditureDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool() == null ? null : entity.getSchool().getId());
        dto.setSchoolName(entity.getSchool() == null ? null : entity.getSchool().getSchoolName());
        dto.setExpenditureHeadId(entity.getExpenditureHead() == null ? null : entity.getExpenditureHead().getId());
        dto.setExpenditureHeadName(entity.getExpenditureHead() == null ? null : entity.getExpenditureHead().getExpenditureHead());
        dto.setExpenditureMethod(entity.getExpenditureMethod());
        dto.setReference(entity.getReference());
        dto.setAmount(entity.getAmount());
        dto.setExpenditureDate(entity.getExpenditureDate());
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
