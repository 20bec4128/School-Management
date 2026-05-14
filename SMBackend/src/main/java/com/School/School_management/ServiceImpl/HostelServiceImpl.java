package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.HostelDto;
import com.School.School_management.Entity.Hostel;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.HostelRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.HostelService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class HostelServiceImpl implements HostelService {

    private final HostelRepository repository;
    private final SchoolRepository schoolRepository;

    public HostelServiceImpl(HostelRepository repository, SchoolRepository schoolRepository) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HostelDto> list(Long headOfficeId, Long schoolId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForRead(user, headOfficeId, schoolId);
        if (scope.schoolId == null && scope.headOfficeId == null) {
            return repository.findAllActiveWithDetailsOrderByIdDesc().stream().map(this::toDto).collect(Collectors.toList());
        }
        if (scope.schoolId != null) {
            return repository.findBySchoolIdActiveWithDetailsOrderByIdDesc(scope.schoolId).stream().map(this::toDto).collect(Collectors.toList());
        }
        return repository.findByHeadOfficeIdActiveWithDetailsOrderByIdDesc(scope.headOfficeId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<HostelDto> listPaginated(Long headOfficeId, Long schoolId, String search, int page, int size) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Scope scope = resolveScopeForRead(user, headOfficeId, schoolId);
        return repository.findPageWithDetails(scope.headOfficeId, scope.schoolId, normalizeOptional(search), pageable).map(this::toDto);
    }

    @Override
    public HostelDto create(HostelDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForWrite(user, dto == null ? null : dto.getHeadOfficeId(), dto == null ? null : dto.getSchoolId());
        Hostel entity = new Hostel();
        applyDto(entity, dto, scope.headOfficeId, scope.schoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public HostelDto update(Long id, HostelDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Hostel entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Scope scope = resolveScopeForWrite(user, dto == null ? null : dto.getHeadOfficeId(), dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchool().getId(), scope.schoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        applyDto(entity, dto, scope.headOfficeId, scope.schoolId);
        return toDto(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Hostel entity = repository.findById(id).orElseThrow(NotFoundException::new);
        Scope scope = resolveScopeForRead(user, entity.getHeadOfficeId(), entity.getSchool() == null ? null : entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), scope.schoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        entity.setDeleted(true);
        repository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public HostelDto getById(Long id) {
        Hostel entity = repository.findByIdWithDetails(id).orElseThrow(NotFoundException::new);
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        Scope scope = resolveScopeForRead(user, entity.getHeadOfficeId(), entity.getSchool() == null ? null : entity.getSchool().getId());
        if (!Objects.equals(entity.getSchool().getId(), scope.schoolId) && !user.isSuperAdmin()) throw new ForbiddenException();
        return toDto(entity);
    }

    private void applyDto(Hostel entity, HostelDto dto, Long headOfficeId, Long schoolId) {
        if (dto == null) throw new BadRequestException("Hostel data is required");
        ManageSchool school = resolveSchool(schoolId);
        Long effectiveHeadOfficeId = resolveHeadOfficeId(school, headOfficeId);
        entity.setHeadOfficeId(effectiveHeadOfficeId);
        entity.setSchool(school);
        entity.setName(required(dto.getName(), "Hostel name is required"));
        entity.setHostelType(required(dto.getHostelType(), "Hostel type is required"));
        entity.setAddress(required(dto.getAddress(), "Address is required"));
        entity.setNote(normalizeOptional(dto.getNote()));
    }

    private ManageSchool resolveSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findById(schoolId).orElseThrow(NotFoundException::new);
    }

    private Long resolveHeadOfficeId(ManageSchool school, Long requestedHeadOfficeId) {
        Long schoolHeadOfficeId = school.getHeadOfficeId();
        if (requestedHeadOfficeId != null && schoolHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, schoolHeadOfficeId)) {
            throw new BadRequestException("Selected school does not belong to the requested head office");
        }
        return schoolHeadOfficeId != null ? schoolHeadOfficeId : requestedHeadOfficeId;
    }

    private Scope resolveScopeForRead(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return new Scope(null, user.schoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId != null) {
                ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
                return new Scope(user.headOfficeId(), requestedSchoolId);
            }
            Long effectiveHeadOfficeId = requestedHeadOfficeId != null ? requestedHeadOfficeId : user.headOfficeId();
            if (effectiveHeadOfficeId == null) throw new BadRequestException("headOfficeId is required");
            if (!Objects.equals(effectiveHeadOfficeId, user.headOfficeId())) throw new ForbiddenException();
            return new Scope(effectiveHeadOfficeId, null);
        }
        return new Scope(requestedHeadOfficeId, requestedSchoolId);
    }

    private Scope resolveScopeForWrite(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return new Scope(null, user.schoolId());
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return new Scope(user.headOfficeId(), requestedSchoolId);
        }
        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return new Scope(requestedHeadOfficeId, requestedSchoolId);
    }

    private void ensureSchoolInHeadOffice(Long schoolId, Long headOfficeId) {
        if (!schoolRepository.findByIdAndIsDeletedFalseAndHeadOfficeId(schoolId, headOfficeId).isPresent()) {
            throw new NotFoundException();
        }
    }

    private HostelDto toDto(Hostel entity) {
        HostelDto dto = new HostelDto();
        dto.setId(entity.getId());
        dto.setHeadOfficeId(entity.getHeadOfficeId());
        dto.setSchoolId(entity.getSchool() == null ? null : entity.getSchool().getId());
        dto.setSchoolName(entity.getSchool() == null ? null : entity.getSchool().getSchoolName());
        dto.setName(entity.getName());
        dto.setHostelType(entity.getHostelType());
        dto.setAddress(entity.getAddress());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private String required(String value, String message) {
        String trimmed = normalizeOptional(value);
        if (trimmed == null) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record Scope(Long headOfficeId, Long schoolId) {}
}
