package com.School.School_management.Controller;

import com.School.School_management.Dto.SliderDto;
import com.School.School_management.Service.SliderService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sliders")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class SliderController {
    private final SliderService service;
    public SliderController(SliderService service) { this.service = service; }

    @GetMapping
    public List<SliderDto> list(@RequestParam(required = false) Long headOfficeId, @RequestParam(required = false) Long schoolId) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    public Page<SliderDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.listPaginated(headOfficeId, schoolId, status, search, page, size);
    }

    @PostMapping
    public SliderDto create(@RequestBody SliderDto dto) { return service.create(dto); }

    @PutMapping("/{id}")
    public SliderDto update(@PathVariable Long id, @RequestBody SliderDto dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) { service.delete(id); return "Slider deleted successfully"; }
}
