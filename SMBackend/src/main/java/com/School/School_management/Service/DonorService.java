package com.School.School_management.Service;

import com.School.School_management.Dto.DonorDto;
import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Entity.Donor;
import com.School.School_management.Exception.DonorNotFoundException;
import com.School.School_management.Repository.DonorRepository;
import com.School.School_management.Repository.SchoolRepository;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DonorService {

    private final DonorRepository donorRepository;
    private final SchoolRepository schoolRepository;

    public DonorService(DonorRepository donorRepository, SchoolRepository schoolRepository) {
        this.donorRepository = donorRepository;
        this.schoolRepository = schoolRepository;
    }

    @Transactional(readOnly = true)
    public PaginationResponse<DonorDto.Response> getAll(
            int page,
            int size,
            Long headOfficeId,
            Long schoolId,
            String donorType,
            String academicYear,
            String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedDonorType = normalize(donorType);
        String normalizedAcademicYear = normalize(academicYear);
        String normalizedSearch = normalize(search);

        Page<DonorDto.Response> pageResult = donorRepository
                .searchDonors(headOfficeId, schoolId, normalizedDonorType, normalizedAcademicYear, normalizedSearch, pageable)
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
    public DonorDto.Response create(DonorDto.Request request) {
        validateRequest(request);
        Donor entity = toEntity(request, new Donor());
        return toResponse(donorRepository.save(entity));
    }

    @Transactional
    public DonorDto.Response update(Long id, DonorDto.Request request) {
        Donor entity = donorRepository.findById(id).orElseThrow(() -> new DonorNotFoundException(id));
        validateRequest(request);
        entity = toEntity(request, entity);
        return toResponse(donorRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!donorRepository.existsById(id)) {
            throw new DonorNotFoundException(id);
        }
        donorRepository.deleteById(id);
    }

    private void validateRequest(DonorDto.Request request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (request.getSchoolId() == null) throw new IllegalArgumentException("School is required");
        if (normalize(request.getDonorType()) == null) throw new IllegalArgumentException("Donor type is required");
        if (normalize(request.getDonorName()) == null) throw new IllegalArgumentException("Donor name is required");
        if (request.getAmount() == null) throw new IllegalArgumentException("Amount is required");
        if (request.getAmount().compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("Amount must be greater than or equal to 0");

        if (schoolRepository.findByIdAndIsDeletedFalse(request.getSchoolId()).isEmpty()) {
            throw new IllegalArgumentException("School not found");
        }
    }

    private Donor toEntity(DonorDto.Request request, Donor target) {
        Donor entity = target != null ? target : new Donor();
        entity.setSchool(schoolRepository.findByIdAndIsDeletedFalse(request.getSchoolId())
                .orElseThrow(() -> new IllegalArgumentException("School not found")));
        entity.setAcademicYear(normalize(request.getAcademicYear()));
        entity.setDonorType(normalize(request.getDonorType()));
        entity.setDonorName(normalize(request.getDonorName()));
        entity.setContactName(normalize(request.getContactName()));
        entity.setEmail(normalize(request.getEmail()));
        entity.setPhone(normalize(request.getPhone()));
        entity.setAmount(request.getAmount());
        entity.setAddress(normalize(request.getAddress()));
        entity.setNote(normalize(request.getNote()));
        return entity;
    }

    private DonorDto.Response toResponse(Donor entity) {
        DonorDto.Response dto = new DonorDto.Response();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool() != null ? entity.getSchool().getId() : null);
        dto.setSchoolName(entity.getSchool() != null ? entity.getSchool().getSchoolName() : null);
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setDonorType(entity.getDonorType());
        dto.setDonorName(entity.getDonorName());
        dto.setContactName(entity.getContactName());
        dto.setEmail(entity.getEmail());
        dto.setPhone(entity.getPhone());
        dto.setAmount(entity.getAmount());
        dto.setAddress(entity.getAddress());
        dto.setNote(entity.getNote());
        return dto;
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

