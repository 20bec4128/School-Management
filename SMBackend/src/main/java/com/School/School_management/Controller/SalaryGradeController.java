package com.School.School_management.Controller;

import com.School.School_management.Dto.SalaryGradeDto;
import com.School.School_management.Service.SalaryGradeService;
import com.School.School_management.auth.RequirePermission;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salary-grades")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class SalaryGradeController {

    private final SalaryGradeService salaryGradeService;

    public SalaryGradeController(SalaryGradeService salaryGradeService) {
        this.salaryGradeService = salaryGradeService;
    }

    @GetMapping
    public List<SalaryGradeDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId) {
        return salaryGradeService.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
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
    public SalaryGradeDto create(@RequestBody SalaryGradeDto dto) {
        return salaryGradeService.create(dto);
    }

    @PutMapping("/{id}")
    public SalaryGradeDto update(@PathVariable Long id, @RequestBody SalaryGradeDto dto) {
        return salaryGradeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        salaryGradeService.delete(id);
        return "Salary Grade deleted successfully";
    }
}
