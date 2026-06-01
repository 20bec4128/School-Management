package com.School.School_management.Controller;

import com.School.School_management.Dto.ComplainDto;
import com.School.School_management.Service.ComplainService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
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
@RequestMapping("/api/complains")
public class ComplainController {

    private final ComplainService service;

    public ComplainController(ComplainService service) {
        this.service = service;
    }

    @GetMapping("/school/{schoolId}")
    @RequirePagePermission(slug = "manage-complain", action = "view")
    public List<ComplainDto> getAllBySchool(@PathVariable Long schoolId) {
        return service.getAllBySchool(schoolId);
    }

    @GetMapping
    @RequirePagePermission(slug = "manage-complain", action = "view")
    public Page<ComplainDto> page(
            @RequestParam Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Long complainTypeId,
            @RequestParam(required = false) String userType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.pageBySchool(schoolId, search, academicYear, complainTypeId, userType, page, size);
    }

    @PostMapping
    @RequirePagePermission(slug = "manage-complain", action = "add")
    public ComplainDto create(@RequestBody ComplainDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "manage-complain", action = "edit")
    public ComplainDto update(@PathVariable Long id, @RequestBody ComplainDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "manage-complain", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
