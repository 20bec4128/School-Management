package com.School.School_management.Controller;

import com.School.School_management.Dto.IncomeDto;
import com.School.School_management.Service.IncomeService;
import com.School.School_management.auth.RequirePagePermission;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incomes")
@RequirePagePermission(slug = "income", action = "view")
public class IncomeController {

    private final IncomeService service;

    public IncomeController(IncomeService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "income", action = "view")
    public List<IncomeDto> list(@RequestParam(required = false) Long schoolId) {
        return service.list(schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "income", action = "view")
    public Page<IncomeDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long incomeHeadId,
            @RequestParam(required = false) String incomeMethod,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(schoolId, incomeHeadId, incomeMethod, startDate, endDate, page, size, search);
    }

    @PostMapping
    @RequirePagePermission(slug = "income", action = "add")
    public IncomeDto create(@RequestBody IncomeDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "income", action = "edit")
    public IncomeDto update(@PathVariable Long id, @RequestBody IncomeDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "income", action = "delete")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Income deleted successfully";
    }
}
