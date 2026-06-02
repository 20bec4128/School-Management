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
import com.School.School_management.auth.RequirePagePermission;

@RestController
@RequestMapping("/api/submissions")
@RequirePagePermission(slug = "submission", action = "view")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping
    @RequirePagePermission(slug = "submission", action = "add")
    public ResponseEntity<Submission> createSubmission(
            @RequestPart("data") SubmissionRequestDto dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        return ResponseEntity.ok(submissionService.createSubmission(dto, file));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @RequirePagePermission(slug = "submission", action = "edit")
    public ResponseEntity<Submission> updateSubmission(
            @PathVariable Long id,
            @RequestPart("data") SubmissionRequestDto dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        return ResponseEntity.ok(submissionService.updateSubmission(id, dto, file));
    }

    @GetMapping
    @RequirePagePermission(slug = "submission", action = "view")
    public ResponseEntity<List<Submission>> getAllSubmissions() {
        return ResponseEntity.ok(submissionService.getAllSubmissions());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "submission", action = "view")
    public ResponseEntity<Submission> getSubmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.getSubmissionById(id));
    }

    @GetMapping("/assignment/{assignmentId}")
    @RequirePagePermission(slug = "submission", action = "view")
    public ResponseEntity<List<Submission>> getByAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(submissionService.getByAssignment(assignmentId));
    }

    @GetMapping("/student/{studentId}")
    @RequirePagePermission(slug = "submission", action = "view")
    public ResponseEntity<List<Submission>> getByStudent(@PathVariable Long studentId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user != null && user.isRole("STUDENT") && user.studentId() != null) {
            studentId = user.studentId();
        }
        return ResponseEntity.ok(submissionService.getByStudent(studentId));
    }

    @PutMapping("/{id}/evaluate")
    @RequirePagePermission(slug = "submission", action = "edit")
    public ResponseEntity<Submission> evaluateSubmission(
            @PathVariable Long id,
            @RequestBody SubmissionEvaluateDto dto) {

        return ResponseEntity.ok(submissionService.evaluateSubmission(id, dto));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "submission", action = "delete")
    public ResponseEntity<String> deleteSubmission(@PathVariable Long id) {
        submissionService.deleteSubmission(id);
        return ResponseEntity.ok("Submission deleted successfully");
    }
}
