package com.School.School_management.Service;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.ScholarshipDto;
import com.School.School_management.Entity.Scholarship;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.SchoolSection;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.ScholarshipNotFoundException;
import com.School.School_management.Repository.ScholarshipRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SchoolSectionRepository;
import com.School.School_management.Repository.StudentRepository;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScholarshipService {

    private final ScholarshipRepository scholarshipRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SchoolSectionRepository schoolSectionRepository;
    private final StudentRepository studentRepository;

    public ScholarshipService(
            ScholarshipRepository scholarshipRepository,
            SchoolRepository schoolRepository,
            SchoolClassRepository schoolClassRepository,
            SchoolSectionRepository schoolSectionRepository,
            StudentRepository studentRepository) {
        this.scholarshipRepository = scholarshipRepository;
        this.schoolRepository = schoolRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.schoolSectionRepository = schoolSectionRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public PaginationResponse<ScholarshipDto.Response> getAll(
            int page,
            int size,
            Long headOfficeId,
            Long schoolId,
            Long classId,
            Long sectionId,
            String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedSearch = normalize(search);

        Page<ScholarshipDto.Response> pageResult = scholarshipRepository
                .searchScholarships(headOfficeId, schoolId, classId, sectionId, normalizedSearch, pageable)
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
    public ScholarshipDto.Response create(ScholarshipDto.Request request) {
        validateRequest(request);
        Scholarship entity = toEntity(request, new Scholarship());
        return toResponse(scholarshipRepository.save(entity));
    }

    @Transactional
    public ScholarshipDto.Response update(Long id, ScholarshipDto.Request request) {
        Scholarship entity = scholarshipRepository.findById(id).orElseThrow(() -> new ScholarshipNotFoundException(id));
        validateRequest(request);
        entity = toEntity(request, entity);
        return toResponse(scholarshipRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!scholarshipRepository.existsById(id)) {
            throw new ScholarshipNotFoundException(id);
        }
        scholarshipRepository.deleteById(id);
    }

    private void validateRequest(ScholarshipDto.Request request) {
        if (request == null) throw new IllegalArgumentException("Request body is required");
        if (request.getSchoolId() == null) throw new IllegalArgumentException("School is required");
        if (request.getClassId() == null) throw new IllegalArgumentException("Class is required");
        if (request.getSectionId() == null) throw new IllegalArgumentException("Section is required");
        if (request.getStudentId() == null) throw new IllegalArgumentException("Student is required");
        if (request.getPaymentDate() == null) throw new IllegalArgumentException("Payment date is required");
        if (request.getAmount() == null) throw new IllegalArgumentException("Amount is required");
        if (request.getAmount().compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("Amount must be greater than or equal to 0");

        if (schoolRepository.findByIdAndIsDeletedFalse(request.getSchoolId()).isEmpty()) {
            throw new IllegalArgumentException("School not found");
        }

        SchoolClass schoolClass = schoolClassRepository.findById(request.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));
        if (schoolClass.getSchool() == null || schoolClass.getSchool().getId() == null || !request.getSchoolId().equals(schoolClass.getSchool().getId())) {
            throw new IllegalArgumentException("Class does not belong to the selected school");
        }

        SchoolSection section = schoolSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new IllegalArgumentException("Section not found"));
        if (section.getSchool() == null || section.getSchool().getId() == null || !request.getSchoolId().equals(section.getSchool().getId())) {
            throw new IllegalArgumentException("Section does not belong to the selected school");
        }
        if (section.getSchoolClass() == null || section.getSchoolClass().getId() == null || !request.getClassId().equals(section.getSchoolClass().getId())) {
            throw new IllegalArgumentException("Section does not belong to the selected class");
        }

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        if (Boolean.TRUE.equals(student.getDeleted())) throw new IllegalArgumentException("Student not found");
        if (student.getSchool() == null || student.getSchool().getId() == null || !request.getSchoolId().equals(student.getSchool().getId())) {
            throw new IllegalArgumentException("Student does not belong to the selected school");
        }
        if (student.getSchoolClass() == null || student.getSchoolClass().getId() == null || !request.getClassId().equals(student.getSchoolClass().getId())) {
            throw new IllegalArgumentException("Student does not belong to the selected class");
        }
        if (student.getSchoolSection() == null || student.getSchoolSection().getId() == null || !request.getSectionId().equals(student.getSchoolSection().getId())) {
            throw new IllegalArgumentException("Student does not belong to the selected section");
        }
    }

    private Scholarship toEntity(ScholarshipDto.Request request, Scholarship target) {
        Scholarship entity = target != null ? target : new Scholarship();
        entity.setSchool(schoolRepository.findByIdAndIsDeletedFalse(request.getSchoolId())
                .orElseThrow(() -> new IllegalArgumentException("School not found")));
        entity.setSchoolClass(schoolClassRepository.findById(request.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Class not found")));
        entity.setSchoolSection(schoolSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new IllegalArgumentException("Section not found")));
        entity.setStudent(studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found")));
        entity.setAmount(request.getAmount());
        entity.setPaymentDate(request.getPaymentDate());
        entity.setNote(normalize(request.getNote()));
        return entity;
    }

    private ScholarshipDto.Response toResponse(Scholarship entity) {
        ScholarshipDto.Response dto = new ScholarshipDto.Response();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool() != null ? entity.getSchool().getId() : null);
        dto.setSchoolName(entity.getSchool() != null ? entity.getSchool().getSchoolName() : null);
        dto.setClassId(entity.getSchoolClass() != null ? entity.getSchoolClass().getId() : null);
        dto.setClassName(entity.getSchoolClass() != null ? firstNonBlank(entity.getSchoolClass().getClassName(), entity.getSchoolClass().getNumericName()) : null);
        dto.setSectionId(entity.getSchoolSection() != null ? entity.getSchoolSection().getId() : null);
        dto.setSectionName(entity.getSchoolSection() != null ? entity.getSchoolSection().getName() : null);
        dto.setStudentId(entity.getStudent() != null ? entity.getStudent().getId() : null);
        dto.setStudentName(entity.getStudent() != null ? entity.getStudent().getName() : null);
        dto.setRollNo(entity.getStudent() != null ? entity.getStudent().getRollNo() : null);
        dto.setAmount(entity.getAmount());
        dto.setPaymentDate(entity.getPaymentDate());
        dto.setNote(entity.getNote());
        return dto;
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) return primary;
        return fallback;
    }
}

