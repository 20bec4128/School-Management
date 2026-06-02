package com.School.School_management.Controller;

import com.School.School_management.Dto.DiscountDto;
import com.School.School_management.Service.DiscountService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discounts")
@RequirePagePermission(slug = "discount", action = "view")
public class DiscountController {

    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @GetMapping
    @RequirePagePermission(slug = "discount", action = "view")
    public List<DiscountDto> list(@RequestParam(required = false) Long schoolId) {
        return discountService.list(schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "discount", action = "view")
    public Page<DiscountDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return discountService.listPaginated(schoolId, page, size, search);
    }

    @PostMapping
    @RequirePagePermission(slug = "discount", action = "add")
    public DiscountDto create(@RequestBody DiscountDto dto) {
        return discountService.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "discount", action = "edit")
    public DiscountDto update(@PathVariable Long id, @RequestBody DiscountDto dto) {
        return discountService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "discount", action = "delete")
    public String delete(@PathVariable Long id) {
        discountService.delete(id);
        return "Discount deleted successfully";
    }
}
