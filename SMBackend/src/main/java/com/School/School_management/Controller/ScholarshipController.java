package com.School.School_management.Controller;

import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Dto.ScholarshipDto;
import com.School.School_management.Service.ScholarshipService;
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
@RequestMapping("/api/scholarships")
public class ScholarshipController {

    private final ScholarshipService scholarshipService;

    public ScholarshipController(ScholarshipService scholarshipService) {
        this.scholarshipService = scholarshipService;
    }

    @GetMapping
    @RequirePagePermission(slug = "scholarship", action = "view")
    public ResponseEntity<PaginationResponse<ScholarshipDto.Response>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(scholarshipService.getAll(page, size, headOfficeId, schoolId, classId, sectionId, search));
    }

    @PostMapping
    @RequirePagePermission(slug = "scholarship", action = "add")
    public ResponseEntity<ScholarshipDto.Response> create(@RequestBody ScholarshipDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scholarshipService.create(request));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "scholarship", action = "edit")
    public ResponseEntity<ScholarshipDto.Response> update(
            @PathVariable Long id,
            @RequestBody ScholarshipDto.Request request) {
        return ResponseEntity.ok(scholarshipService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "scholarship", action = "delete")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        scholarshipService.delete(id);
        return ResponseEntity.ok("Scholarship deleted successfully");
    }
}
