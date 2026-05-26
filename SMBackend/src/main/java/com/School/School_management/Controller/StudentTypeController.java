package com.School.School_management.Controller;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentTypeDto;
import com.School.School_management.Service.StudentTypeService;
import com.School.School_management.auth.RequirePagePermission;
import com.School.School_management.auth.RequirePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student-types")
public class StudentTypeController {

    @Autowired
    private StudentTypeService studentTypeService;

    @GetMapping
    @RequirePagePermission(slug = "student-type", action = "view")
    public ResponseEntity<PaginationResponse<StudentTypeDto.Response>> getAll(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(studentTypeService.getAll(headOfficeId, schoolId, page, size));
    }

    @PostMapping
    @RequirePagePermission(slug = "student-type", action = "add")
    public ResponseEntity<StudentTypeDto.Response> create(
            @RequestBody StudentTypeDto.Request request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentTypeService.create(request));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "student-type", action = "edit")
    public ResponseEntity<StudentTypeDto.Response> update(
            @PathVariable Long id,
            @RequestBody StudentTypeDto.Request request
    ) {
        return ResponseEntity.ok(studentTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "student-type", action = "delete")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        studentTypeService.delete(id);
        return ResponseEntity.ok("Student type deleted successfully");
    }
}
