// com/School/School_management/Service/StudentActivityService.java
package com.School.School_management.Service;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentActivityDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Student;
import com.School.School_management.Entity.StudentActivity;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.SchoolSection;
import com.School.School_management.Exception.StudentActivityNotFoundException;
import com.School.School_management.Repository.StudentActivityRepository;
import com.School.School_management.Repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentActivityService {

    private final StudentActivityRepository studentActivityRepository;
    private final StudentRepository studentRepository;

    public StudentActivityService(
            StudentActivityRepository studentActivityRepository,
            StudentRepository studentRepository) {
        this.studentActivityRepository = studentActivityRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public PaginationResponse<StudentActivityDto.Response> getAll(int page, int size,
                                                                    Long headOfficeId,
                                                                    Long schoolId,
                                                                    String className, 
                                                                    String section) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("activityDate").descending());
        Page<StudentActivity> activityPage;
        
        if (headOfficeId != null || schoolId != null || className != null || section != null) {
            activityPage = studentActivityRepository.searchActivities(headOfficeId, schoolId, className, section, pageable);
        } else {
            activityPage = studentActivityRepository.findByDeletedFalse(pageable);
        }
        
        Page<StudentActivityDto.Response> responsePage = activityPage.map(this::toResponse);
        
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
    public StudentActivityDto.Response create(StudentActivityDto.Request request) {
        Student student = resolveStudent(request.getStudentId(), request.getSchoolId());
        ManageSchool school = new ManageSchool();
        school.setId(student.getSchool() != null ? student.getSchool().getId() : request.getSchoolId());
        
        StudentActivity activity = new StudentActivity();
        activity.setSchool(school);
        activity.setStudent(student);
        activity.setClassName(resolveClassName(student.getSchoolClass(), request.getClassName()));
        activity.setSection(resolveSectionName(student.getSchoolSection(), request.getSection()));
        activity.setActivityDate(request.getDate());
        activity.setActivityName(request.getActivity());
        activity.setDescription(request.getDescription());
        activity.setDeleted(false);
        
        StudentActivity saved = studentActivityRepository.save(activity);
        return toResponse(saved);
    }

    @Transactional
    public StudentActivityDto.Response update(Long id, StudentActivityDto.Request request) {
        StudentActivity activity = studentActivityRepository.findById(id)
            .orElseThrow(() -> new StudentActivityNotFoundException(id));
        
        Student student = resolveStudent(request.getStudentId(), request.getSchoolId());
        ManageSchool school = new ManageSchool();
        school.setId(student.getSchool() != null ? student.getSchool().getId() : request.getSchoolId());
        
        activity.setSchool(school);
        activity.setStudent(student);
        activity.setClassName(resolveClassName(student.getSchoolClass(), request.getClassName()));
        activity.setSection(resolveSectionName(student.getSchoolSection(), request.getSection()));
        activity.setActivityDate(request.getDate());
        activity.setActivityName(request.getActivity());
        activity.setDescription(request.getDescription());
        
        StudentActivity updated = studentActivityRepository.save(activity);
        return toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        StudentActivity activity = studentActivityRepository.findById(id)
            .orElseThrow(() -> new StudentActivityNotFoundException(id));
        activity.setDeleted(true);
        studentActivityRepository.save(activity);
    }

    private StudentActivityDto.Response toResponse(StudentActivity entity) {
        StudentActivityDto.Response response = new StudentActivityDto.Response();
        response.setId(entity.getId());
        response.setSchoolId(entity.getSchool() != null ? entity.getSchool().getId() : null);
        response.setSchoolName(entity.getSchool() != null ? entity.getSchool().getSchoolName() : null);
        response.setStudentId(entity.getStudent() != null ? entity.getStudent().getId() : null);
        response.setStudentName(entity.getStudent() != null ? entity.getStudent().getName() : null);
        response.setClassName(entity.getClassName());
        response.setSection(entity.getSection());
        response.setDate(entity.getActivityDate());
        response.setActivity(entity.getActivityName());
        response.setDescription(entity.getDescription());
        return response;
    }

    private Student resolveStudent(Long studentId, Long schoolId) {
        if (studentId == null) {
            throw new IllegalArgumentException("Student is required");
        }
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new IllegalArgumentException("Student not found: " + studentId));
        if (schoolId != null && student.getSchool() != null && !schoolId.equals(student.getSchool().getId())) {
            throw new IllegalArgumentException("Student does not belong to the selected school");
        }
        return student;
    }

    private String resolveClassName(SchoolClass schoolClass, String fallback) {
        if (schoolClass == null) {
            return fallback;
        }
        if (schoolClass.getClassName() != null && !schoolClass.getClassName().isBlank()) {
            return schoolClass.getClassName();
        }
        return schoolClass.getNumericName() != null && !schoolClass.getNumericName().isBlank()
            ? schoolClass.getNumericName()
            : fallback;
    }

    private String resolveSectionName(SchoolSection schoolSection, String fallback) {
        if (schoolSection == null) {
            return fallback;
        }
        return schoolSection.getName() != null && !schoolSection.getName().isBlank()
            ? schoolSection.getName()
            : fallback;
    }
}
