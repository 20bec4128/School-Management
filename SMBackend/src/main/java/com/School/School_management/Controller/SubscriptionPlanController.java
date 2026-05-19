package com.School.School_management.Controller;

import com.School.School_management.Dto.SubscriptionPlanDto;
import com.School.School_management.Service.SubscriptionPlanService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscription-plans")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class SubscriptionPlanController {
    private final SubscriptionPlanService service;
    public SubscriptionPlanController(SubscriptionPlanService service) { this.service = service; }

    @GetMapping
    public List<SubscriptionPlanDto> list() { return service.list(); }

    @GetMapping("/page")
    public Page<SubscriptionPlanDto> listPaginated(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) { return service.listPaginated(status, search, page, size); }

    @PostMapping
    public SubscriptionPlanDto create(@RequestBody SubscriptionPlanDto dto) { return service.create(dto); }

    @PutMapping("/{id}")
    public SubscriptionPlanDto update(@PathVariable Long id, @RequestBody SubscriptionPlanDto dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) { service.delete(id); return "Subscription plan deleted successfully"; }
}
