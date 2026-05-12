package com.School.School_management.Controller;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentTypeDto;
import com.School.School_management.Service.StudentTypeService;
import com.School.School_management.auth.RequirePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student-types")
@RequirePermission({"STUDENT_TYPE_MANAGE", "*"})
public class StudentTypeController {

    private final StudentTypeService studentTypeService;

    public StudentTypeController(StudentTypeService studentTypeService) {
        this.studentTypeService = studentTypeService;
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<StudentTypeDto.Response>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(studentTypeService.getAll(page, size));
    }

    @PostMapping
    public ResponseEntity<StudentTypeDto.Response> create(
            @RequestBody StudentTypeDto.Request request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentTypeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentTypeDto.Response> update(
            @PathVariable Long id,
            @RequestBody StudentTypeDto.Request request
    ) {
        return ResponseEntity.ok(studentTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        studentTypeService.delete(id);
        return ResponseEntity.ok("Student type deleted successfully");
    }
}
