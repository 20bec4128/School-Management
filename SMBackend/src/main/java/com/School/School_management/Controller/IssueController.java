package com.School.School_management.Controller;

import com.School.School_management.Dto.IssueDto;
import com.School.School_management.Dto.IssueRecipientDto;
import com.School.School_management.Service.IssueService;
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

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@RequirePagePermission(slug = "issue", action = "view")
public class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @GetMapping
    @RequirePagePermission(slug = "issue", action = "view")
    public Page<IssueDto> list(
            @RequestParam(name = "headOfficeId", required = false) Long headOfficeId,
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "userType", required = false) String userType,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return issueService.list(headOfficeId, schoolId, userType, search, page, size, CurrentUserHolder.get());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "issue", action = "view")
    public IssueDto getById(@PathVariable("id") Long id) {
        return issueService.getById(id, CurrentUserHolder.get());
    }

    @PostMapping
    @RequirePagePermission(slug = "issue", action = "add")
    public IssueDto create(@RequestBody IssueDto dto) {
        return issueService.create(dto, CurrentUserHolder.get());
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "issue", action = "edit")
    public IssueDto update(@PathVariable("id") Long id, @RequestBody IssueDto dto) {
        return issueService.update(id, dto, CurrentUserHolder.get());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "issue", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        issueService.delete(id, CurrentUserHolder.get());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/lookups/roles")
    @RequirePagePermission(slug = "issue", action = "view")
    public List<String> roles(@RequestParam(name = "schoolId", required = false) Long schoolId) {
        return issueService.roles(schoolId, CurrentUserHolder.get());
    }

    @GetMapping("/lookups/recipients")
    @RequirePagePermission(slug = "issue", action = "view")
    public List<IssueRecipientDto> recipients(
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "role", required = false) String role
    ) {
        return issueService.recipients(schoolId, role, CurrentUserHolder.get());
    }
}
