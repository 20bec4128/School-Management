package com.School.School_management.Service;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentTypeDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Studenttype;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Exception.StudentTypeNotFoundException;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.StudentTypeRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentTypeService {

    private final StudentTypeRepository studentTypeRepository;
    private final SchoolRepository schoolRepository;

    public StudentTypeService(StudentTypeRepository studentTypeRepository, SchoolRepository schoolRepository) {
        this.studentTypeRepository = studentTypeRepository;
        this.schoolRepository = schoolRepository;
    }

    @Transactional(readOnly = true)
    public PaginationResponse<StudentTypeDto.Response> getAll(Long headOfficeId, Long schoolId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        List<Long> schoolIds = resolveSchoolIds(headOfficeId, schoolId);
        Page<Studenttype> pageResult;

        if (schoolIds == null) {
            pageResult = studentTypeRepository.findAll(pageable);
        } else if (schoolIds.isEmpty()) {
            pageResult = Page.empty(pageable);
        } else if (schoolIds.size() == 1) {
            pageResult = studentTypeRepository.findBySchoolId(schoolIds.get(0), pageable);
        } else {
            pageResult = studentTypeRepository.findBySchoolIdIn(schoolIds, pageable);
        }

        Page<StudentTypeDto.Response> responsePage = pageResult.map(this::toResponse);
        return new PaginationResponse<>(
                responsePage.getContent(),
                responsePage.getTotalPages(),
                responsePage.getTotalElements(),
                page,
                size,
                responsePage.hasNext(),
                responsePage.hasPrevious()
        );
    }

    @Transactional
    public StudentTypeDto.Response create(StudentTypeDto.Request request) {
        Long schoolId = requireSchoolId(request.getSchoolId());
        ManageSchool school = requireSchool(schoolId);
        validateScope(request.getHeadOfficeId(), school);

        if (studentTypeRepository.existsBySchoolIdAndStudentTypeIgnoreCase(
                schoolId, request.getStudentType())) {
            throw new IllegalArgumentException(
                    "Student type '" + request.getStudentType() + "' already exists for this school");
        }

        Studenttype entity = Studenttype.builder()
                .school(school)
                .studentType(request.getStudentType())
                .note(request.getNote())
                .build();

        return toResponse(studentTypeRepository.save(entity));
    }

    @Transactional
    public StudentTypeDto.Response update(Long id, StudentTypeDto.Request request) {
        Studenttype entity = studentTypeRepository.findById(id)
                .orElseThrow(() -> new StudentTypeNotFoundException(id));

        Long schoolId = requireSchoolId(request.getSchoolId());
        ManageSchool school = requireSchool(schoolId);
        validateScope(request.getHeadOfficeId(), school);

        if (studentTypeRepository.existsBySchoolIdAndStudentTypeIgnoreCaseAndIdNot(
                schoolId, request.getStudentType(), id)) {
            throw new IllegalArgumentException(
                    "Student type '" + request.getStudentType() + "' already exists for this school");
        }

        entity.setSchool(school);
        entity.setStudentType(request.getStudentType());
        entity.setNote(request.getNote());

        return toResponse(studentTypeRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!studentTypeRepository.existsById(id)) {
            throw new StudentTypeNotFoundException(id);
        }
        studentTypeRepository.deleteById(id);
    }

    private StudentTypeDto.Response toResponse(Studenttype entity) {
        return StudentTypeDto.Response.builder()
                .id(entity.getId())
                .schoolId(entity.getSchool() != null ? entity.getSchool().getId() : null)
                .schoolName(entity.getSchool() != null ? entity.getSchool().getSchoolName() : null)
                .studentType(entity.getStudentType())
                .note(entity.getNote())
                .build();
    }

    private List<Long> resolveSchoolIds(Long headOfficeId, Long schoolId) {
        if (schoolId != null) {
            if (headOfficeId != null) {
                validateScope(headOfficeId, requireSchool(schoolId));
            }
            return List.of(schoolId);
        }

        if (headOfficeId != null) {
            return schoolRepository.findAllByIsDeletedFalseAndHeadOfficeId(headOfficeId)
                    .stream()
                    .map(ManageSchool::getId)
                    .filter(Objects::nonNull)
                    .toList();
        }

        return null;
    }

    private Long requireSchoolId(Long schoolId) {
        if (schoolId == null) {
            throw new IllegalArgumentException("School ID is required");
        }
        return schoolId;
    }

    private ManageSchool requireSchool(Long schoolId) {
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .orElseThrow(NotFoundException::new);
    }

    private void validateScope(Long headOfficeId, ManageSchool school) {
        if (headOfficeId == null || school == null || school.getHeadOfficeId() == null) return;
        if (!Objects.equals(headOfficeId, school.getHeadOfficeId())) {
            throw new IllegalArgumentException("School does not belong to the selected head office");
        }
    }
}
