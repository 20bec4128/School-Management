package com.School.School_management.Controller;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentActivityDto;
import com.School.School_management.Service.StudentActivityService;
import com.School.School_management.auth.RequirePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student-activities")
@RequirePermission({"STUDENT_MANAGE", "*"})
public class StudentActivityController {

    private final StudentActivityService studentActivityService;

    public StudentActivityController(StudentActivityService studentActivityService) {
        this.studentActivityService = studentActivityService;
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<StudentActivityDto.Response>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String section
    ) {
        return ResponseEntity.ok(studentActivityService.getAll(page, size, schoolId, className, section));
    }

    @PostMapping
    public ResponseEntity<StudentActivityDto.Response> create(@RequestBody StudentActivityDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentActivityService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentActivityDto.Response> update(
            @PathVariable Long id,
            @RequestBody StudentActivityDto.Request request
    ) {
        return ResponseEntity.ok(studentActivityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        studentActivityService.delete(id);
        return ResponseEntity.ok("Student activity deleted successfully");
    }
}

