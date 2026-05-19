package com.School.School_management.Controller;

import com.School.School_management.Dto.SalaryPaymentDto;
import com.School.School_management.Service.SalaryPaymentService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/salary-payments")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class SalaryPaymentController {

    private final SalaryPaymentService service;

    public SalaryPaymentController(SalaryPaymentService service) {
        this.service = service;
    }

    @GetMapping
    public List<SalaryPaymentDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    public Page<SalaryPaymentDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String gradeName,
            @RequestParam(required = false) String salaryType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(headOfficeId, schoolId, month, gradeName, salaryType, status, page, size, search);
    }

    @PostMapping
    public SalaryPaymentDto create(@RequestBody SalaryPaymentDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public SalaryPaymentDto update(@PathVariable Long id, @RequestBody SalaryPaymentDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Salary payment deleted successfully";
    }
}
