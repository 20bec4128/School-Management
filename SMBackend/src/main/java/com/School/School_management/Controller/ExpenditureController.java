package com.School.School_management.Controller;

import com.School.School_management.Dto.ExpenditureDto;
import com.School.School_management.Service.ExpenditureService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenditures")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class ExpenditureController {

    private final ExpenditureService service;

    public ExpenditureController(ExpenditureService service) {
        this.service = service;
    }

    @GetMapping
    public List<ExpenditureDto> list(@RequestParam(required = false) Long schoolId) {
        return service.list(schoolId);
    }

    @GetMapping("/page")
    public Page<ExpenditureDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long expenditureHeadId,
            @RequestParam(required = false) String expenditureMethod,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(schoolId, expenditureHeadId, expenditureMethod, page, size, search);
    }

    @PostMapping
    public ExpenditureDto create(@RequestBody ExpenditureDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ExpenditureDto update(@PathVariable Long id, @RequestBody ExpenditureDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Expenditure deleted successfully";
    }
}
