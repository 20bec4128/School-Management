package com.School.School_management.Controller;

import com.School.School_management.Dto.DiscountDto;
import com.School.School_management.Service.DiscountService;
import com.School.School_management.auth.RequirePermission;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discounts")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class DiscountController {

    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @GetMapping
    public List<DiscountDto> list(@RequestParam(required = false) Long schoolId) {
        return discountService.list(schoolId);
    }

    @GetMapping("/page")
    public Page<DiscountDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return discountService.listPaginated(schoolId, page, size, search);
    }

    @PostMapping
    public DiscountDto create(@RequestBody DiscountDto dto) {
        return discountService.create(dto);
    }

    @PutMapping("/{id}")
    public DiscountDto update(@PathVariable Long id, @RequestBody DiscountDto dto) {
        return discountService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        discountService.delete(id);
        return "Discount deleted successfully";
    }
}
