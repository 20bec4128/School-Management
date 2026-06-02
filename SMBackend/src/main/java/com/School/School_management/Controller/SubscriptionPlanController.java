package com.School.School_management.Controller;

import com.School.School_management.Dto.SubscriptionPlanDto;
import com.School.School_management.Service.SubscriptionPlanService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscription-plans")
@RequirePagePermission(slug = "subscription-plan", action = "view")
public class SubscriptionPlanController {
    private final SubscriptionPlanService service;
    public SubscriptionPlanController(SubscriptionPlanService service) { this.service = service; }

    @GetMapping
    @RequirePagePermission(slug = "subscription-plan", action = "view")
    public List<SubscriptionPlanDto> list() { return service.list(); }

    @GetMapping("/page")
    @RequirePagePermission(slug = "subscription-plan", action = "view")
    public Page<SubscriptionPlanDto> listPaginated(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) { return service.listPaginated(status, search, page, size); }

    @PostMapping
    @RequirePagePermission(slug = "subscription-plan", action = "add")
    public SubscriptionPlanDto create(@RequestBody SubscriptionPlanDto dto) { return service.create(dto); }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "subscription-plan", action = "edit")
    public SubscriptionPlanDto update(@PathVariable Long id, @RequestBody SubscriptionPlanDto dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "subscription-plan", action = "delete")
    public String delete(@PathVariable Long id) { service.delete(id); return "Subscription plan deleted successfully"; }
}
