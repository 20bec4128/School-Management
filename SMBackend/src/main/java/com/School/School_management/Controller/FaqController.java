package com.School.School_management.Controller;

import com.School.School_management.Dto.FaqDto;
import com.School.School_management.Service.FaqService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faqs")
@RequirePagePermission(slug = "faq", action = "view")
public class FaqController {

    private final FaqService service;

    public FaqController(FaqService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "faq", action = "view")
    public List<FaqDto> list(@RequestParam(required = false) Long headOfficeId, @RequestParam(required = false) Long schoolId) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "faq", action = "view")
    public Page<FaqDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.listPaginated(headOfficeId, schoolId, title, search, page, size);
    }

    @PostMapping
    @RequirePagePermission(slug = "faq", action = "add")
    public FaqDto create(@RequestBody FaqDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "faq", action = "edit")
    public FaqDto update(@PathVariable Long id, @RequestBody FaqDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "faq", action = "delete")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "FAQ deleted successfully";
    }
}
