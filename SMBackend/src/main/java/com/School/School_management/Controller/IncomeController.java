package com.School.School_management.Controller;

import com.School.School_management.Dto.IncomeDto;
import com.School.School_management.Service.IncomeService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incomes")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class IncomeController {

    private final IncomeService service;

    public IncomeController(IncomeService service) {
        this.service = service;
    }

    @GetMapping
    public List<IncomeDto> list(@RequestParam(required = false) Long schoolId) {
        return service.list(schoolId);
    }

    @GetMapping("/page")
    public Page<IncomeDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long incomeHeadId,
            @RequestParam(required = false) String incomeMethod,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(schoolId, incomeHeadId, incomeMethod, page, size, search);
    }

    @PostMapping
    public IncomeDto create(@RequestBody IncomeDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public IncomeDto update(@PathVariable Long id, @RequestBody IncomeDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Income deleted successfully";
    }
}
