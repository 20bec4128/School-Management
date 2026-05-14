package com.School.School_management.Controller;

import com.School.School_management.Dto.FeeTypeDto;
import com.School.School_management.Service.FeeTypeService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fee-types")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class FeeTypeController {

    private final FeeTypeService feeTypeService;

    public FeeTypeController(FeeTypeService feeTypeService) {
        this.feeTypeService = feeTypeService;
    }

    @GetMapping
    public List<FeeTypeDto> list(@RequestParam(required = false) Long schoolId) {
        return feeTypeService.list(schoolId);
    }

    @GetMapping("/page")
    public Page<FeeTypeDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return feeTypeService.listPaginated(schoolId, page, size, search);
    }

    @PostMapping
    public FeeTypeDto create(@RequestBody FeeTypeDto dto) {
        return feeTypeService.create(dto);
    }

    @PutMapping("/{id}")
    public FeeTypeDto update(@PathVariable Long id, @RequestBody FeeTypeDto dto) {
        return feeTypeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        feeTypeService.delete(id);
        return "Fee type deleted successfully";
    }
}
