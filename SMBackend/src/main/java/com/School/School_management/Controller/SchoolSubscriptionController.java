package com.School.School_management.Controller;

import com.School.School_management.Dto.SchoolSubscriptionDto;
import com.School.School_management.Service.SchoolSubscriptionService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/school-subscriptions")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class SchoolSubscriptionController {
    private final SchoolSubscriptionService service;
    public SchoolSubscriptionController(SchoolSubscriptionService service) { this.service = service; }

    @GetMapping
    public List<SchoolSubscriptionDto> list(@RequestParam(required = false) Long headOfficeId, @RequestParam(required = false) Long schoolId) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
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
    public SchoolSubscriptionDto create(@RequestBody SchoolSubscriptionDto dto) { return service.create(dto); }

    @PutMapping("/{id}")
    public SchoolSubscriptionDto update(@PathVariable Long id, @RequestBody SchoolSubscriptionDto dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) { service.delete(id); return "School subscription deleted successfully"; }
}
