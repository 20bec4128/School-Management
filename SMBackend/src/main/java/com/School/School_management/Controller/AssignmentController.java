package com.School.School_management.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.School.School_management.Dto.AssignmentRequestDto;
import com.School.School_management.Entity.Assignment;
import com.School.School_management.Service.AssignmentService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;

@RestController
@RequestMapping("/api/assignments")
@RequirePagePermission(slug = "assignment", action = "view")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping
    @RequirePagePermission(slug = "assignment", action = "add")
    public ResponseEntity<Assignment> createAssignment(
            @ModelAttribute AssignmentRequestDto dto,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(assignmentService.createAssignment(dto, file));
    }

    @GetMapping
    @RequirePagePermission(slug = "assignment", action = "view")
    public ResponseEntity<List<Assignment>> getAllAssignments(@RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(assignmentService.getAllAssignments(schoolId));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "assignment", action = "view")
    public ResponseEntity<Assignment> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id));
    }

    @GetMapping("/student/{studentId}")
    @RequirePagePermission(slug = "assignment", action = "view")
    public ResponseEntity<List<Assignment>> getAssignmentsForStudent(@PathVariable Long studentId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user != null && user.isRole("STUDENT") && user.studentId() != null) {
            studentId = user.studentId();
        }
        return ResponseEntity.ok(assignmentService.getAssignmentsForStudent(studentId));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "assignment", action = "edit")
    public ResponseEntity<Assignment> updateAssignment(
            @PathVariable Long id,
            @ModelAttribute AssignmentRequestDto dto,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, dto, file));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "assignment", action = "delete")
    public ResponseEntity<String> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.ok("Assignment deleted successfully");
    }
}
