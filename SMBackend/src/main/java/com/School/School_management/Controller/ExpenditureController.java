package com.School.School_management.Controller;

import com.School.School_management.Dto.ExpenditureDto;
import com.School.School_management.Service.ExpenditureService;
import com.School.School_management.auth.RequirePagePermission;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenditures")
@RequirePagePermission(slug = "expenditure", action = "view")
public class ExpenditureController {

    private final ExpenditureService service;

    public ExpenditureController(ExpenditureService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "expenditure", action = "view")
    public List<ExpenditureDto> list(@RequestParam(required = false) Long schoolId) {
        return service.list(schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "expenditure", action = "view")
    public Page<ExpenditureDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long expenditureHeadId,
            @RequestParam(required = false) String expenditureMethod,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(schoolId, expenditureHeadId, expenditureMethod, startDate, endDate, page, size, search);
    }

    @PostMapping
    @RequirePagePermission(slug = "expenditure", action = "add")
    public ExpenditureDto create(@RequestBody ExpenditureDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "expenditure", action = "edit")
    public ExpenditureDto update(@PathVariable Long id, @RequestBody ExpenditureDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "expenditure", action = "delete")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Expenditure deleted successfully";
    }
}
