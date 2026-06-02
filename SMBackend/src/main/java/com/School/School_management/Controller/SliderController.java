package com.School.School_management.Controller;

import com.School.School_management.Dto.SliderDto;
import com.School.School_management.Service.SliderService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sliders")
@RequirePagePermission(slug = "slider", action = "view")
public class SliderController {
    private final SliderService service;
    public SliderController(SliderService service) { this.service = service; }

    @GetMapping
    @RequirePagePermission(slug = "slider", action = "view")
    public List<SliderDto> list(@RequestParam(required = false) Long headOfficeId, @RequestParam(required = false) Long schoolId) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "slider", action = "view")
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
    @RequirePagePermission(slug = "slider", action = "add")
    public SliderDto create(@RequestBody SliderDto dto) { return service.create(dto); }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "slider", action = "edit")
    public SliderDto update(@PathVariable Long id, @RequestBody SliderDto dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "slider", action = "delete")
    public String delete(@PathVariable Long id) { service.delete(id); return "Slider deleted successfully"; }
}
