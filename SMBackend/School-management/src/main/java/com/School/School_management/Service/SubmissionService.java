package com.School.School_management.Service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.School.School_management.Dto.SubmissionEvaluateDto;
import com.School.School_management.Dto.SubmissionRequestDto;
import com.School.School_management.Entity.Submission;

public interface SubmissionService {

    Submission createSubmission(SubmissionRequestDto dto, MultipartFile file);

    Submission updateSubmission(Long id, SubmissionRequestDto dto, MultipartFile file);

    List<Submission> getAllSubmissions();

    Submission getSubmissionById(Long id);

    List<Submission> getByAssignment(Long assignmentId);

    List<Submission> getByStudent(Long studentId);

    Submission evaluateSubmission(Long id, SubmissionEvaluateDto dto);

    void deleteSubmission(Long id);
}
