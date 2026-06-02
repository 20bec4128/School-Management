package com.School.School_management.Controller;

import com.School.School_management.Dto.LibraryIssueDto;
import com.School.School_management.Service.LibraryIssueService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;
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
@RequestMapping("/api/library-issues")
@RequirePagePermission(slug = "issue-return", action = "view")
public class LibraryIssueController {

    private final LibraryIssueService service;

    public LibraryIssueController(LibraryIssueService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "issue-return", action = "view")
    public Page<LibraryIssueDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.list(headOfficeId, schoolId, status, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "issue-return", action = "view")
    public LibraryIssueDto getById(@PathVariable Long id) {
        return service.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    @RequirePagePermission(slug = "issue-return", action = "add")
    public LibraryIssueDto create(@RequestBody LibraryIssueDto dto) {
        return service.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "issue-return", action = "edit")
    public LibraryIssueDto update(@PathVariable Long id, @RequestBody LibraryIssueDto dto) {
        return service.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "issue-return", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }
}
