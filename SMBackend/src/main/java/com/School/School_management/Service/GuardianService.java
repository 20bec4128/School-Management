package com.School.School_management.Service;

import com.School.School_management.Dto.GuardianDto;
import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Entity.Guardian;
import com.School.School_management.Exception.GuardianNotFoundException;
import com.School.School_management.Repository.GuardianRepository;
import com.School.School_management.Repository.SchoolRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GuardianService {

    private final GuardianRepository guardianRepository;
    private final SchoolRepository schoolRepository;

    public GuardianService(GuardianRepository guardianRepository, SchoolRepository schoolRepository) {
        this.guardianRepository = guardianRepository;
        this.schoolRepository = schoolRepository;
    }

    @Transactional(readOnly = true)
    public PaginationResponse<GuardianDto.Response> getAll(
            int page,
            int size,
            Long headOfficeId,
            Long schoolId,
            String profession,
            String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<GuardianDto.Response> pageResult = guardianRepository
                .searchGuardians(headOfficeId, schoolId, normalize(profession), normalize(search), pageable)
                .map(this::toResponse);

        return new PaginationResponse<>(
                pageResult.getContent(),
                pageResult.getTotalPages(),
                pageResult.getTotalElements(),
                page,
                size,
                pageResult.hasNext(),
                pageResult.hasPrevious());
    }

    @Transactional
    public GuardianDto.Response create(GuardianDto.Request request) {
        validateRequest(request, true);
        Guardian entity = toEntity(request, new Guardian());
        return toResponse(guardianRepository.save(entity));
    }

    @Transactional
    public GuardianDto.Response update(Long id, GuardianDto.Request request) {
        Guardian entity = guardianRepository.findById(id).orElseThrow(() -> new GuardianNotFoundException(id));
        validateRequest(request, false);
        entity = toEntity(request, entity);
        return toResponse(guardianRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!guardianRepository.existsById(id)) {
            throw new GuardianNotFoundException(id);
        }
        guardianRepository.deleteById(id);
    }

    private void validateRequest(GuardianDto.Request request, boolean requirePassword) {
        if (request == null) throw new IllegalArgumentException("Request body is required");
        if (request.getSchoolId() == null) throw new IllegalArgumentException("School is required");
        if (normalize(request.getName()) == null) throw new IllegalArgumentException("Name is required");
        if (normalize(request.getPhone()) == null) throw new IllegalArgumentException("Phone is required");
        if (normalize(request.getProfession()) == null) throw new IllegalArgumentException("Profession is required");
        if (normalize(request.getUsername()) == null) throw new IllegalArgumentException("Username is required");
        if (requirePassword && normalize(request.getPassword()) == null) throw new IllegalArgumentException("Password is required");
        if (schoolRepository.findByIdAndIsDeletedFalse(request.getSchoolId()).isEmpty()) {
            throw new IllegalArgumentException("School not found");
        }
    }

    private Guardian toEntity(GuardianDto.Request request, Guardian target) {
        Guardian entity = target != null ? target : new Guardian();
        entity.setSchool(schoolRepository.findByIdAndIsDeletedFalse(request.getSchoolId())
                .orElseThrow(() -> new IllegalArgumentException("School not found")));
        entity.setName(normalize(request.getName()));
        entity.setPhone(normalize(request.getPhone()));
        entity.setProfession(normalize(request.getProfession()));
        entity.setReligion(normalize(request.getReligion()));
        entity.setPresentAddress(normalize(request.getPresentAddress()));
        entity.setPermanentAddress(normalize(request.getPermanentAddress()));
        entity.setNationalId(normalize(request.getNationalId()));
        entity.setEmail(normalize(request.getEmail()));
        entity.setUsername(normalize(request.getUsername()));
        if (normalize(request.getPassword()) != null) {
            entity.setPassword(normalize(request.getPassword()));
        }
        entity.setOtherInfo(normalize(request.getOtherInfo()));
        entity.setPhotoUrl(normalize(request.getPhotoUrl()));
        return entity;
    }

    private GuardianDto.Response toResponse(Guardian entity) {
        GuardianDto.Response dto = new GuardianDto.Response();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool() != null ? entity.getSchool().getId() : null);
        dto.setSchoolName(entity.getSchool() != null ? entity.getSchool().getSchoolName() : null);
        dto.setName(entity.getName());
        dto.setPhone(entity.getPhone());
        dto.setProfession(entity.getProfession());
        dto.setReligion(entity.getReligion());
        dto.setPresentAddress(entity.getPresentAddress());
        dto.setPermanentAddress(entity.getPermanentAddress());
        dto.setNationalId(entity.getNationalId());
        dto.setEmail(entity.getEmail());
        dto.setUsername(entity.getUsername());
        dto.setOtherInfo(entity.getOtherInfo());
        dto.setPhotoUrl(entity.getPhotoUrl());
        return dto;
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
