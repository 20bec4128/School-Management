package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.DesignationDto;
import com.School.School_management.Entity.Designation;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.DesignationRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.DesignationService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DesignationServiceImpl implements DesignationService {

    private final DesignationRepository designationRepository;
    private final SchoolRepository schoolRepository;

    public DesignationServiceImpl(DesignationRepository designationRepository, SchoolRepository schoolRepository) {
        this.designationRepository = designationRepository;
        this.schoolRepository = schoolRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DesignationDto> list(Long schoolId, String role) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin() && schoolId == null) {
            return designationRepository.findAllByOrderByIdDesc()
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        }

        Long effectiveSchoolId = effectiveSchoolIdForRead(user, schoolId);
        List<Designation> rows = (role == null || role.isBlank())
                ? designationRepository.findBySchoolIdOrderByIdDesc(effectiveSchoolId)
                : designationRepository.findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(effectiveSchoolId, normalizeRequiredRole(role));
        return rows
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public DesignationDto create(DesignationDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        String role = normalizeRequiredRole(dto == null ? null : dto.getRole());
        String name = normalizeRequired(dto == null ? null : dto.getName(), "Designation name is required");
        String note = normalizeOptional(dto == null ? null : dto.getNote());

        if (designationRepository.existsBySchoolIdAndRoleIgnoreCaseAndNameIgnoreCase(effectiveSchoolId, role, name)) {
            throw new ConflictException("Designation already exists");
        }

        Designation entity = new Designation();
        entity.setSchoolId(effectiveSchoolId);
        entity.setRole(role);
        entity.setName(name);
        entity.setNote(note);
        return toDto(designationRepository.save(entity));
    }

    @Override
    public DesignationDto update(Long id, DesignationDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Designation entity = designationRepository.findById(id).orElseThrow(NotFoundException::new);

        Long effectiveSchoolId = effectiveSchoolIdForWrite(user, dto == null ? null : dto.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            // Prevent cross-school updates even if client tries to pass different schoolId.
            throw new ForbiddenException();
        }

        String role = normalizeRequiredRole(dto == null ? null : dto.getRole());
        String name = normalizeRequired(dto == null ? null : dto.getName(), "Designation name is required");
        String note = normalizeOptional(dto == null ? null : dto.getNote());

        boolean changed = entity.getName() == null
                || !entity.getName().equalsIgnoreCase(name)
                || entity.getRole() == null
                || !entity.getRole().equalsIgnoreCase(role);
        if (changed && designationRepository.existsBySchoolIdAndRoleIgnoreCaseAndNameIgnoreCaseAndIdNot(
                effectiveSchoolId, role, name, id)) {
            throw new ConflictException("Designation already exists");
        }

        entity.setSchoolId(effectiveSchoolId);
        entity.setRole(role);
        entity.setName(name);
        entity.setNote(note);
        return toDto(designationRepository.save(entity));
    }

    @Override
    public void delete(Long id) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        Designation entity = designationRepository.findById(id).orElseThrow(NotFoundException::new);
        Long effectiveSchoolId = effectiveSchoolIdForRead(user, entity.getSchoolId());
        if (!Objects.equals(entity.getSchoolId(), effectiveSchoolId) && !user.isSuperAdmin()) {
            throw new ForbiddenException();
        }
        designationRepository.delete(entity);
    }

    private Long effectiveSchoolIdForRead(CurrentUser user, Long requestedSchoolId) {
        if (user.isSchoolScoped()) {
            if (user.schoolId() == null) throw new ForbiddenException();
            return user.schoolId();
        }

        if (user.isHeadOfficeScopedAdmin()) {
            if (requestedSchoolId == null) {
                throw new BadRequestException("schoolId is required");
            }
            ensureSchoolInHeadOffice(requestedSchoolId, user.headOfficeId());
            return requestedSchoolId;
        }

        // SUPER_ADMIN / global admins
        if (requestedSchoolId == null) throw new BadRequestException("schoolId is required");
        return requestedSchoolId;
    }

    private Long effectiveSchoolIdForWrite(CurrentUser user, Long requestedSchoolId) {
        // SCHOOL_ADMIN and all "school-scoped" roles are fixed to one schoolId.
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

    private DesignationDto toDto(Designation entity) {
        DesignationDto dto = new DesignationDto();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchoolId());
        dto.setSchoolName(resolveSchoolName(entity.getSchoolId()));
        dto.setRole(entity.getRole());
        dto.setName(entity.getName());
        dto.setNote(entity.getNote());
        return dto;
    }

    private String normalizeRequiredRole(String value) {
        String role = normalizeRequired(value, "Role is required");
        role = role.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        role = role.replaceAll("_+", "_");
        role = role.replaceAll("^_+|_+$", "");
        if (role.isBlank()) throw new BadRequestException("Role is required");
        return role;
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
}
