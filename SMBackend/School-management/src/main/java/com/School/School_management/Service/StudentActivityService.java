// com/School/School_management/Service/StudentActivityService.java
package com.School.School_management.Service;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentActivityDto;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Student;
import com.School.School_management.Entity.StudentActivity;
import com.School.School_management.Exception.StudentActivityNotFoundException;
import com.School.School_management.Repository.StudentActivityRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentActivityService {

    private final StudentActivityRepository studentActivityRepository;

    public StudentActivityService(StudentActivityRepository studentActivityRepository) {
        this.studentActivityRepository = studentActivityRepository;
    }

    @Transactional(readOnly = true)
    public PaginationResponse<StudentActivityDto.Response> getAll(int page, int size, 
                                                                    Long schoolId, 
                                                                    String className, 
                                                                    String section) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("activityDate").descending());
        Page<StudentActivity> activityPage;
        
        if (schoolId != null || className != null || section != null) {
            activityPage = studentActivityRepository.searchActivities(schoolId, className, section, pageable);
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
        ManageSchool school = new ManageSchool();
        school.setId(request.getSchoolId());
        
        Student student = new Student();
        student.setId(request.getStudentId());
        
        StudentActivity activity = new StudentActivity();
        activity.setSchool(school);
        activity.setStudent(student);
        activity.setClassName(request.getClassName());
        activity.setSection(request.getSection());
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
        
        ManageSchool school = new ManageSchool();
        school.setId(request.getSchoolId());
        
        Student student = new Student();
        student.setId(request.getStudentId());
        
        activity.setSchool(school);
        activity.setStudent(student);
        activity.setClassName(request.getClassName());
        activity.setSection(request.getSection());
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
}