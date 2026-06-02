package com.School.School_management.Controller;

import com.School.School_management.Dto.SchoolSubscriptionDto;
import com.School.School_management.Service.SchoolSubscriptionService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/school-subscriptions")
@RequirePagePermission(slug = "school-subscription", action = "view")
public class SchoolSubscriptionController {
    private final SchoolSubscriptionService service;
    public SchoolSubscriptionController(SchoolSubscriptionService service) { this.service = service; }

    @GetMapping
    @RequirePagePermission(slug = "school-subscription", action = "view")
    public List<SchoolSubscriptionDto> list(@RequestParam(required = false) Long headOfficeId, @RequestParam(required = false) Long schoolId) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "school-subscription", action = "view")
    public Page<SchoolSubscriptionDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.listPaginated(headOfficeId, schoolId, status, search, page, size);
    }

    @PostMapping
    @RequirePagePermission(slug = "school-subscription", action = "add")
    public SchoolSubscriptionDto create(@RequestBody SchoolSubscriptionDto dto) { return service.create(dto); }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "school-subscription", action = "edit")
    public SchoolSubscriptionDto update(@PathVariable Long id, @RequestBody SchoolSubscriptionDto dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "school-subscription", action = "delete")
    public String delete(@PathVariable Long id) { service.delete(id); return "School subscription deleted successfully"; }
}
