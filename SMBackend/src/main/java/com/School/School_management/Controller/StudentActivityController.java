package com.School.School_management.Controller;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentActivityDto;
import com.School.School_management.Service.StudentActivityService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;
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
@RequirePagePermission(slug = "student-activity", action = "view")
public class StudentActivityController {

    private final StudentActivityService studentActivityService;

    public StudentActivityController(StudentActivityService studentActivityService) {
        this.studentActivityService = studentActivityService;
    }

    @GetMapping
    @RequirePagePermission(slug = "student-activity", action = "view")
    public ResponseEntity<PaginationResponse<StudentActivityDto.Response>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String section
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (user != null) {
            if (user.isSchoolScoped() && user.schoolId() != null) {
                schoolId = user.schoolId();
                headOfficeId = null;
            } else if (user.isHeadOfficeScopedAdmin() && user.headOfficeId() != null) {
                headOfficeId = user.headOfficeId();
            }
        }
        return ResponseEntity.ok(studentActivityService.getAll(page, size, headOfficeId, schoolId, className, section));
    }

    @PostMapping
    @RequirePagePermission(slug = "student-activity", action = "add")
    public ResponseEntity<StudentActivityDto.Response> create(@RequestBody StudentActivityDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentActivityService.create(request));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "student-activity", action = "edit")
    public ResponseEntity<StudentActivityDto.Response> update(
            @PathVariable Long id,
            @RequestBody StudentActivityDto.Request request
    ) {
        return ResponseEntity.ok(studentActivityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "student-activity", action = "delete")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        studentActivityService.delete(id);
        return ResponseEntity.ok("Student activity deleted successfully");
    }
}

