package com.School.School_management.Controller;

import com.School.School_management.Dto.SalaryGradeDto;
import com.School.School_management.Service.SalaryGradeService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salary-grades")
@RequirePagePermission(slug = "salary-grade", action = "view")
public class SalaryGradeController {

    private final SalaryGradeService salaryGradeService;

    public SalaryGradeController(SalaryGradeService salaryGradeService) {
        this.salaryGradeService = salaryGradeService;
    }

    @GetMapping
    @RequirePagePermission(slug = "salary-grade", action = "view")
    public List<SalaryGradeDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId) {
        return salaryGradeService.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "salary-grade", action = "view")
    public Page<SalaryGradeDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return salaryGradeService.listPaginated(headOfficeId, schoolId, page, size, search);
    }

    @PostMapping
    @RequirePagePermission(slug = "salary-grade", action = "add")
    public SalaryGradeDto create(@RequestBody SalaryGradeDto dto) {
        return salaryGradeService.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "salary-grade", action = "edit")
    public SalaryGradeDto update(@PathVariable Long id, @RequestBody SalaryGradeDto dto) {
        return salaryGradeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "salary-grade", action = "delete")
    public String delete(@PathVariable Long id) {
        salaryGradeService.delete(id);
        return "Salary Grade deleted successfully";
    }
}
