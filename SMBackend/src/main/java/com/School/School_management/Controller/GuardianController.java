package com.School.School_management.Controller;

import com.School.School_management.Dto.GuardianDto;
import com.School.School_management.Dto.PaginationResponse;
import com.School.School_management.Service.GuardianService;
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
@RequestMapping("/api/guardians")
public class GuardianController {

    private final GuardianService guardianService;

    public GuardianController(GuardianService guardianService) {
        this.guardianService = guardianService;
    }

    @GetMapping
    @RequirePagePermission(slug = "guardian", action = "view")
    public ResponseEntity<PaginationResponse<GuardianDto.Response>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String profession,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(guardianService.getAll(page, size, headOfficeId, schoolId, profession, search));
    }

    @PostMapping
    @RequirePagePermission(slug = "guardian", action = "add")
    public ResponseEntity<GuardianDto.Response> create(@RequestBody GuardianDto.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(guardianService.create(request));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "guardian", action = "edit")
    public ResponseEntity<GuardianDto.Response> update(
            @PathVariable Long id,
            @RequestBody GuardianDto.Request request) {
        return ResponseEntity.ok(guardianService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "guardian", action = "delete")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        guardianService.delete(id);
        return ResponseEntity.ok("Guardian deleted successfully");
    }
}
