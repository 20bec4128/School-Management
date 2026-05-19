package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.FeeCollectionDto;
import com.School.School_management.Entity.*;
import com.School.School_management.Repository.*;
import com.School.School_management.Service.FeeCollectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
@Transactional
public class FeeCollectionServiceImpl implements FeeCollectionService {

    @Autowired
    private FeeCollectionRepository repository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private SchoolClassRepository classRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FeeTypeRepository feeTypeRepository;

    @Override
    public FeeCollectionDto createFeeCollection(FeeCollectionDto dto) {
        FeeCollection entity = new FeeCollection();
        mapDtoToEntity(dto, entity);
        
        // Generate Invoice Number if not provided
        if (entity.getInvoiceNumber() == null || entity.getInvoiceNumber().isEmpty()) {
            entity.setInvoiceNumber("INV-" + System.currentTimeMillis());
        }

        FeeCollection saved = repository.save(entity);
        return mapEntityToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeCollectionDto> getAllFeeCollections() {
        return repository.findAllActiveWithDetailsOrderByIdDesc().stream()
                .map(this::mapEntityToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeeCollectionDto> getFeeCollectionsBySchool(Long schoolId) {
        return repository.findBySchoolIdActiveWithDetailsOrderByIdDesc(schoolId).stream()
                .map(this::mapEntityToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FeeCollectionDto> getFeeCollectionsPage(Long schoolId, Long classId, Long feeTypeId, String status, String month, Boolean dueOnly, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedStatus = normalizeOptional(status);
        String normalizedMonth = normalizeOptional(month);
        String normalizedSearch = normalizeOptional(search);

        return repository.findPageWithDetails(schoolId, classId, feeTypeId, normalizedStatus, normalizedMonth, dueOnly, normalizedSearch, pageable)
                .map(this::mapEntityToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public FeeCollectionDto getFeeCollectionById(Long id) {
        FeeCollection entity = repository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Fee Collection not found"));
        return mapEntityToDto(entity);
    }

    @Override
    public FeeCollectionDto updateFeeCollection(Long id, FeeCollectionDto dto) {
        FeeCollection entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fee Collection not found"));
        mapDtoToEntity(dto, entity);
        FeeCollection saved = repository.save(entity);
        return mapEntityToDto(saved);
    }

    @Override
    public void deleteFeeCollection(Long id) {
        FeeCollection entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fee Collection not found"));
        entity.setDeleted(true);
        repository.save(entity);
    }

    private void mapDtoToEntity(FeeCollectionDto dto, FeeCollection entity) {
        if (dto.getSchoolId() != null) {
            ManageSchool school = schoolRepository.findById(dto.getSchoolId()).orElse(null);
            entity.setSchool(school);
        }
        if (dto.getClassId() != null) {
            SchoolClass schoolClass = classRepository.findById(dto.getClassId()).orElse(null);
            entity.setSchoolClass(schoolClass);
        }
        if (dto.getStudentId() != null) {
            Student student = studentRepository.findById(dto.getStudentId()).orElse(null);
            entity.setStudent(student);
        }
        if (dto.getFeeTypeId() != null) {
            FeeType feeType = feeTypeRepository.findById(dto.getFeeTypeId()).orElse(null);
            entity.setFeeType(feeType);
        }
        entity.setFeeAmount(dto.getFeeAmount());
        entity.setMonth(dto.getMonth());
        entity.setIsApplicableDiscount(dto.getIsApplicableDiscount());
        entity.setPaidStatus(dto.getPaidStatus());
        entity.setNote(dto.getNote());
        entity.setInvoiceNumber(dto.getInvoiceNumber());
        entity.setGrossAmount(dto.getGrossAmount());
        entity.setDiscount(dto.getDiscount());
        entity.setNetAmount(dto.getNetAmount());
        entity.setDueAmount(dto.getDueAmount());
    }

    private FeeCollectionDto mapEntityToDto(FeeCollection entity) {
        FeeCollectionDto dto = new FeeCollectionDto();
        dto.setId(entity.getId());
        if (entity.getSchool() != null) {
            dto.setSchoolId(entity.getSchool().getId());
            dto.setSchoolName(entity.getSchool().getSchoolName());
        }
        if (entity.getSchoolClass() != null) {
            dto.setClassId(entity.getSchoolClass().getId());
            dto.setClassName(entity.getSchoolClass().getClassName());
        }
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentName(entity.getStudent().getName());
        }
        if (entity.getFeeType() != null) {
            dto.setFeeTypeId(entity.getFeeType().getId());
            dto.setFeeTypeTitle(entity.getFeeType().getTitle());
        }
        dto.setFeeAmount(entity.getFeeAmount());
        dto.setMonth(entity.getMonth());
        dto.setIsApplicableDiscount(entity.getIsApplicableDiscount());
        dto.setPaidStatus(entity.getPaidStatus());
        dto.setNote(entity.getNote());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        dto.setGrossAmount(entity.getGrossAmount());
        dto.setDiscount(entity.getDiscount());
        dto.setNetAmount(entity.getNetAmount());
        dto.setDueAmount(entity.getDueAmount());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() || "Select".equalsIgnoreCase(trimmed) ? null : trimmed;
    }

    private boolean matchesValue(String value, String expected) {
        if (value == null && expected == null) return true;
        if (value == null || expected == null) return false;
        return value.trim().equalsIgnoreCase(expected.trim());
    }
}
