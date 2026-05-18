// com/School/School_management/Controller/StudentController.java
package com.School.School_management.Controller;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.StudentDto;
import com.School.School_management.Service.StudentService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@RequirePermission({"STUDENT_MANAGE", "*"})
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<StudentDto.Response>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String group) {
        CurrentUser user = CurrentUserHolder.get();
        if (user != null) {
            if (user.isSchoolScoped() && user.schoolId() != null) {
                schoolId = user.schoolId();
                headOfficeId = null;
            } else if (user.isHeadOfficeScopedAdmin() && user.headOfficeId() != null) {
                headOfficeId = user.headOfficeId();
            }
        }
        return ResponseEntity.ok(studentService.getAll(page, size, headOfficeId, schoolId, classId, sectionId, className, section, group));
    }

    @PostMapping
    public ResponseEntity<StudentDto.Response> create(@RequestBody StudentDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentDto.Response> update(@PathVariable Long id, 
                                                        @RequestBody StudentDto.Request request) {
        return ResponseEntity.ok(studentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        studentService.delete(id);
        return ResponseEntity.ok("Student deleted successfully");
    }
}
