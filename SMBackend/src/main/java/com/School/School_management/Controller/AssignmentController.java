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
import com.School.School_management.auth.RequirePermission;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @RequirePermission({"ASSIGNMENT_MANAGE", "ASSIGNMENT_MANAGE_ASSIGNED", "*"})
    @PostMapping
    public ResponseEntity<Assignment> createAssignment(
            @ModelAttribute AssignmentRequestDto dto,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(assignmentService.createAssignment(dto, file));
    }

    @RequirePermission({"ASSIGNMENT_MANAGE", "ASSIGNMENT_VIEW_OWN", "ASSIGNMENT_VIEW_CHILD", "ASSIGNMENT_MANAGE_ASSIGNED", "*"})
    @GetMapping
    public ResponseEntity<List<Assignment>> getAllAssignments(@RequestParam(required = false) Long schoolId) {
        return ResponseEntity.ok(assignmentService.getAllAssignments(schoolId));
    }

    @RequirePermission({"ASSIGNMENT_MANAGE", "ASSIGNMENT_VIEW_OWN", "ASSIGNMENT_VIEW_CHILD", "ASSIGNMENT_MANAGE_ASSIGNED", "*"})
    @GetMapping("/{id}")
    public ResponseEntity<Assignment> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id));
    }

    @RequirePermission({"ASSIGNMENT_MANAGE", "ASSIGNMENT_VIEW_OWN", "ASSIGNMENT_VIEW_CHILD", "ASSIGNMENT_MANAGE_ASSIGNED", "*"})
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Assignment>> getAssignmentsForStudent(@PathVariable Long studentId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user != null && user.isRole("STUDENT") && user.studentId() != null) {
            studentId = user.studentId();
        }
        return ResponseEntity.ok(assignmentService.getAssignmentsForStudent(studentId));
    }

    @RequirePermission({"ASSIGNMENT_MANAGE", "ASSIGNMENT_MANAGE_ASSIGNED", "*"})
    @PutMapping("/{id}")
    public ResponseEntity<Assignment> updateAssignment(
            @PathVariable Long id,
            @ModelAttribute AssignmentRequestDto dto,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, dto, file));
    }

    @RequirePermission({"ASSIGNMENT_MANAGE", "ASSIGNMENT_MANAGE_ASSIGNED", "*"})
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.ok("Assignment deleted successfully");
    }
}
