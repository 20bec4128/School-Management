package com.School.School_management.Controller;

import com.School.School_management.Dto.FaqDto;
import com.School.School_management.Service.FaqService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faqs")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class FaqController {

    private final FaqService service;

    public FaqController(FaqService service) {
        this.service = service;
    }

    @GetMapping
    public List<FaqDto> list(@RequestParam(required = false) Long headOfficeId, @RequestParam(required = false) Long schoolId) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
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
    public FaqDto create(@RequestBody FaqDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public FaqDto update(@PathVariable Long id, @RequestBody FaqDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "FAQ deleted successfully";
    }
}
