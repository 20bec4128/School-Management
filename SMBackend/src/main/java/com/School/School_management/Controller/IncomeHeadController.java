package com.School.School_management.Controller;

import com.School.School_management.Dto.IncomeHeadDto;
import com.School.School_management.Service.IncomeHeadService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/income-heads")
@RequirePagePermission(slug = "income-head", action = "view")
public class IncomeHeadController {

    private final IncomeHeadService service;

    public IncomeHeadController(IncomeHeadService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "income-head", action = "view")
    public List<IncomeHeadDto> list(@RequestParam(required = false) Long schoolId) {
        return service.list(schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "income-head", action = "view")
    public Page<IncomeHeadDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(schoolId, page, size, search);
    }

    @PostMapping
    @RequirePagePermission(slug = "income-head", action = "add")
    public IncomeHeadDto create(@RequestBody IncomeHeadDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "income-head", action = "edit")
    public IncomeHeadDto update(@PathVariable Long id, @RequestBody IncomeHeadDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "income-head", action = "delete")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Income head deleted successfully";
    }
}
