package com.School.School_management.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.School.School_management.Dto.SubmissionEvaluateDto;
import com.School.School_management.Dto.SubmissionRequestDto;
import com.School.School_management.Entity.Submission;
import com.School.School_management.Service.SubmissionService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @RequirePermission({"ASSIGNMENT_SUBMIT", "*"})
    @PostMapping
    public ResponseEntity<Submission> createSubmission(
            @RequestPart("data") SubmissionRequestDto dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        return ResponseEntity.ok(submissionService.createSubmission(dto, file));
    }

    @RequirePermission({"ASSIGNMENT_SUBMIT", "*"})
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<Submission> updateSubmission(
            @PathVariable Long id,
            @RequestPart("data") SubmissionRequestDto dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        return ResponseEntity.ok(submissionService.updateSubmission(id, dto, file));
    }

    @RequirePermission({"SUBMISSION_MANAGE", "SUBMISSION_VIEW_ASSIGNED", "*"})
    @GetMapping
    public ResponseEntity<List<Submission>> getAllSubmissions() {
        return ResponseEntity.ok(submissionService.getAllSubmissions());
    }

    @RequirePermission({"SUBMISSION_MANAGE", "SUBMISSION_VIEW_ASSIGNED", "SUBMISSION_VIEW_OWN", "SUBMISSION_VIEW_CHILD", "*"})
    @GetMapping("/{id}")
    public ResponseEntity<Submission> getSubmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.getSubmissionById(id));
    }

    @RequirePermission({"SUBMISSION_MANAGE", "SUBMISSION_VIEW_ASSIGNED", "*"})
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<List<Submission>> getByAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(submissionService.getByAssignment(assignmentId));
    }

    @RequirePermission({"SUBMISSION_VIEW_OWN", "SUBMISSION_VIEW_CHILD", "SUBMISSION_VIEW_ASSIGNED", "*"})
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Submission>> getByStudent(@PathVariable Long studentId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user != null && user.isRole("STUDENT") && user.studentId() != null) {
            studentId = user.studentId();
        }
        return ResponseEntity.ok(submissionService.getByStudent(studentId));
    }

    @RequirePermission({"SUBMISSION_MANAGE", "SUBMISSION_EVALUATE_ASSIGNED", "*"})
    @PutMapping("/{id}/evaluate")
    public ResponseEntity<Submission> evaluateSubmission(
            @PathVariable Long id,
            @RequestBody SubmissionEvaluateDto dto) {

        return ResponseEntity.ok(submissionService.evaluateSubmission(id, dto));
    }

    @RequirePermission({"SUBMISSION_MANAGE", "SUBMISSION_VIEW_ASSIGNED", "*"})
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSubmission(@PathVariable Long id) {
        submissionService.deleteSubmission(id);
        return ResponseEntity.ok("Submission deleted successfully");
    }
}
