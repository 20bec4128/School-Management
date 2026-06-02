package com.School.School_management.Controller;

import com.School.School_management.Dto.ExpenditureHeadDto;
import com.School.School_management.Service.ExpenditureHeadService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenditure-heads")
@RequirePagePermission(slug = "expenditure-head", action = "view")
public class ExpenditureHeadController {

    private final ExpenditureHeadService service;

    public ExpenditureHeadController(ExpenditureHeadService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "expenditure-head", action = "view")
    public List<ExpenditureHeadDto> list(@RequestParam(required = false) Long schoolId) {
        return service.list(schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "expenditure-head", action = "view")
    public Page<ExpenditureHeadDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(schoolId, page, size, search);
    }

    @PostMapping
    @RequirePagePermission(slug = "expenditure-head", action = "add")
    public ExpenditureHeadDto create(@RequestBody ExpenditureHeadDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "expenditure-head", action = "edit")
    public ExpenditureHeadDto update(@PathVariable Long id, @RequestBody ExpenditureHeadDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "expenditure-head", action = "delete")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Expenditure head deleted successfully";
    }
}
