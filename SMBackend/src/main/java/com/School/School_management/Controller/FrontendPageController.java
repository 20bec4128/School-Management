package com.School.School_management.Controller;

import com.School.School_management.Dto.FrontendPageDto;
import com.School.School_management.Service.FrontendPageService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/frontend-pages")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class FrontendPageController {
    private final FrontendPageService service;
    public FrontendPageController(FrontendPageService service) { this.service = service; }

    @GetMapping
    public List<FrontendPageDto> list(@RequestParam(required = false) Long headOfficeId, @RequestParam(required = false) Long schoolId) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    public Page<FrontendPageDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.listPaginated(headOfficeId, schoolId, search, page, size);
    }

    @PostMapping
    public FrontendPageDto create(@RequestBody FrontendPageDto dto) { return service.create(dto); }

    @PutMapping("/{id}")
    public FrontendPageDto update(@PathVariable Long id, @RequestBody FrontendPageDto dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) { service.delete(id); return "Frontend page deleted successfully"; }
}
