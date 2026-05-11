package com.School.School_management.Service;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentTypeDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Studenttype;
import com.School.School_management.Exception.StudentTypeNotFoundException;
import com.School.School_management.Repository.StudentTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentTypeService {

    private final StudentTypeRepository studentTypeRepository;

    public StudentTypeService(StudentTypeRepository studentTypeRepository) {
        this.studentTypeRepository = studentTypeRepository;
    }

    // ── Fetch paginated list ──────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PaginationResponse<StudentTypeDto.Response> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        Page<StudentTypeDto.Response> pageResult = studentTypeRepository.findAll(pageable)
                .map(this::toResponse);

        return new PaginationResponse<>(
                pageResult.getContent(),
                pageResult.getTotalPages(),
                pageResult.getTotalElements(),
                page,
                size,
                pageResult.hasNext(),
                pageResult.hasPrevious()
        );
    }

    // ── Create ────────────────────────────────────────────────────────────────
    @Transactional
    public StudentTypeDto.Response create(StudentTypeDto.Request request) {
        if (request.getSchoolId() == null) {
            throw new IllegalArgumentException("School ID is required");
        }
        if (studentTypeRepository.existsBySchoolIdAndStudentTypeIgnoreCase(
                request.getSchoolId(), request.getStudentType())) {
            throw new IllegalArgumentException(
                    "Student type '" + request.getStudentType() + "' already exists for this school");
        }

        ManageSchool school = new ManageSchool();
        school.setId(request.getSchoolId());    // reference by ID (no extra query needed)

        Studenttype entity = Studenttype.builder()
                .school(school)
                .studentType(request.getStudentType())
                .note(request.getNote())
                .build();

        return toResponse(studentTypeRepository.save(entity));
    }

    // ── Update ────────────────────────────────────────────────────────────────
    @Transactional
    public StudentTypeDto.Response update(Long id, StudentTypeDto.Request request) {
        Studenttype entity = studentTypeRepository.findById(id)
                .orElseThrow(() -> new StudentTypeNotFoundException(id));

        if (request.getSchoolId() == null) {
            throw new IllegalArgumentException("School ID is required");
        }
        if (studentTypeRepository.existsBySchoolIdAndStudentTypeIgnoreCaseAndIdNot(
                request.getSchoolId(), request.getStudentType(), id)) {
            throw new IllegalArgumentException(
                    "Student type '" + request.getStudentType() + "' already exists for this school");
        }

        ManageSchool school = new ManageSchool();
        school.setId(request.getSchoolId());

        entity.setSchool(school);
        entity.setStudentType(request.getStudentType());
        entity.setNote(request.getNote());

        return toResponse(studentTypeRepository.save(entity));
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @Transactional
    public void delete(Long id) {
        if (!studentTypeRepository.existsById(id)) {
            throw new StudentTypeNotFoundException(id);
        }
        studentTypeRepository.deleteById(id);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private StudentTypeDto.Response toResponse(Studenttype entity) {
        return StudentTypeDto.Response.builder()
                .id(entity.getId())
                .schoolId(entity.getSchool() != null ? entity.getSchool().getId() : null)
                .schoolName(entity.getSchool() != null ? entity.getSchool().getSchoolName() : null)
                .studentType(entity.getStudentType())
                .note(entity.getNote())
                .build();
    }
}