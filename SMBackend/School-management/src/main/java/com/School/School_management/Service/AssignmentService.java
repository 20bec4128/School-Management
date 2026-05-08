package com.School.School_management.Service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.School.School_management.Dto.AssignmentRequestDto;
import com.School.School_management.Entity.Assignment;

public interface AssignmentService {

    Assignment createAssignment(AssignmentRequestDto dto, MultipartFile file);

    List<Assignment> getAllAssignments();

    List<Assignment> getAssignmentsForStudent(Long studentId);

    Assignment getAssignmentById(Long id);

    Assignment updateAssignment(Long id, AssignmentRequestDto dto, MultipartFile file);

    void deleteAssignment(Long id);
}
