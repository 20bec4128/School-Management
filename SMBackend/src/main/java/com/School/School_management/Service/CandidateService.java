package com.School.School_management.Service;

import com.School.School_management.Dto.CandidateDto;
import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Entity.Candidate;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.SchoolSection;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.CandidateNotFoundException;
import com.School.School_management.Repository.CandidateRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolSectionRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SchoolSectionRepository schoolSectionRepository;
    private final StudentRepository studentRepository;

    public CandidateService(
            CandidateRepository candidateRepository,
            SchoolRepository schoolRepository,
            SchoolClassRepository schoolClassRepository,
            SchoolSectionRepository schoolSectionRepository,
            StudentRepository studentRepository) {
        this.candidateRepository = candidateRepository;
        this.schoolRepository = schoolRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.schoolSectionRepository = schoolSectionRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public PaginationResponse<CandidateDto.Response> getAll(
            int page,
            int size,
            Long headOfficeId,
            Long schoolId,
            Long classId,
            Long sectionId,
            String academicYear,
            String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String normalizedAcademicYear = normalize(academicYear);
        String normalizedSearch = normalize(search);
        Page<CandidateDto.Response> pageResult = candidateRepository
                .searchCandidates(headOfficeId, schoolId, classId, sectionId, normalizedAcademicYear, normalizedSearch, pageable)
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
    public CandidateDto.Response create(CandidateDto.Request request) {
        validateRequest(request, null);
        Candidate entity = toEntity(request, new Candidate());
        return toResponse(candidateRepository.save(entity));
    }

    @Transactional
    public CandidateDto.Response update(Long id, CandidateDto.Request request) {
        Candidate entity = candidateRepository.findById(id)
                .orElseThrow(() -> new CandidateNotFoundException(id));
        validateRequest(request, id);
        entity = toEntity(request, entity);
        return toResponse(candidateRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!candidateRepository.existsById(id)) {
            throw new CandidateNotFoundException(id);
        }
        candidateRepository.deleteById(id);
    }

    private void validateRequest(CandidateDto.Request request, Long excludeId) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (request.getSchoolId() == null) throw new IllegalArgumentException("School is required");
        if (request.getClassId() == null) throw new IllegalArgumentException("Class is required");
        if (request.getSectionId() == null) throw new IllegalArgumentException("Section is required");
        if (request.getStudentId() == null) throw new IllegalArgumentException("Student is required");
        if (normalize(request.getAcademicYear()) == null) throw new IllegalArgumentException("Academic year is required");

        if (schoolRepository.findByIdAndIsDeletedFalse(request.getSchoolId()).isEmpty()) {
            throw new IllegalArgumentException("School not found");
        }

        SchoolClass schoolClass = schoolClassRepository.findById(request.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));
        if (schoolClass.getSchool() == null || !request.getSchoolId().equals(schoolClass.getSchool().getId())) {
            throw new IllegalArgumentException("Class does not belong to the selected school");
        }

        SchoolSection section = schoolSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new IllegalArgumentException("Section not found"));
        if (section.getSchool() == null || !request.getSchoolId().equals(section.getSchool().getId())) {
            throw new IllegalArgumentException("Section does not belong to the selected school");
        }
        if (section.getSchoolClass() == null || !request.getClassId().equals(section.getSchoolClass().getId())) {
            throw new IllegalArgumentException("Section does not belong to the selected class");
        }

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        if (Boolean.TRUE.equals(student.getDeleted())) {
            throw new IllegalArgumentException("Student not found");
        }
        if (student.getSchool() == null || !request.getSchoolId().equals(student.getSchool().getId())) {
            throw new IllegalArgumentException("Student does not belong to the selected school");
        }
        if (student.getSchoolClass() == null || !request.getClassId().equals(student.getSchoolClass().getId())) {
            throw new IllegalArgumentException("Student does not belong to the selected class");
        }
        if (student.getSchoolSection() == null || !request.getSectionId().equals(student.getSchoolSection().getId())) {
            throw new IllegalArgumentException("Student does not belong to the selected section");
        }

        String academicYear = normalize(request.getAcademicYear());
        boolean duplicate = excludeId == null
                ? candidateRepository.existsBySchool_IdAndSchoolClass_IdAndSchoolSection_IdAndStudent_IdAndAcademicYearIgnoreCase(
                        request.getSchoolId(),
                        request.getClassId(),
                        request.getSectionId(),
                        request.getStudentId(),
                        academicYear)
                : candidateRepository.existsBySchool_IdAndSchoolClass_IdAndSchoolSection_IdAndStudent_IdAndAcademicYearIgnoreCaseAndIdNot(
                        request.getSchoolId(),
                        request.getClassId(),
                        request.getSectionId(),
                        request.getStudentId(),
                        academicYear,
                        excludeId);
        if (duplicate) {
            throw new IllegalArgumentException("This student is already marked as a candidate for the selected academic year");
        }
    }

    private Candidate toEntity(CandidateDto.Request request, Candidate target) {
        Candidate entity = target != null ? target : new Candidate();
        entity.setSchool(resolveSchool(request.getSchoolId()));
        entity.setSchoolClass(resolveClass(request.getClassId()));
        entity.setSchoolSection(resolveSection(request.getSectionId()));
        entity.setStudent(resolveStudent(request.getStudentId()));
        entity.setAcademicYear(normalize(request.getAcademicYear()));
        entity.setNote(normalize(request.getNote()));
        return entity;
    }

    private CandidateDto.Response toResponse(Candidate entity) {
        CandidateDto.Response dto = new CandidateDto.Response();
        dto.setId(entity.getId());
        dto.setSchoolId(entity.getSchool() != null ? entity.getSchool().getId() : null);
        dto.setSchoolName(entity.getSchool() != null ? entity.getSchool().getSchoolName() : null);
        dto.setClassId(entity.getSchoolClass() != null ? entity.getSchoolClass().getId() : null);
        dto.setClassName(entity.getSchoolClass() != null
                ? firstNonBlank(entity.getSchoolClass().getClassName(), entity.getSchoolClass().getNumericName())
                : null);
        dto.setSectionId(entity.getSchoolSection() != null ? entity.getSchoolSection().getId() : null);
        dto.setSectionName(entity.getSchoolSection() != null ? entity.getSchoolSection().getName() : null);
        dto.setStudentId(entity.getStudent() != null ? entity.getStudent().getId() : null);
        dto.setStudentName(entity.getStudent() != null ? entity.getStudent().getName() : null);
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setNote(entity.getNote());
        return dto;
    }

    private SchoolClass resolveClass(Long id) {
        return schoolClassRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));
    }

    private SchoolSection resolveSection(Long id) {
        return schoolSectionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Section not found"));
    }

    private Student resolveStudent(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
    }

    private com.School.School_management.Entity.ManageSchool resolveSchool(Long id) {
        return schoolRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("School not found"));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        return fallback;
    }
}
