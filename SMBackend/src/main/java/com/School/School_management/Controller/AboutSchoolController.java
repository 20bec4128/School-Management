package com.School.School_management.Controller;

import com.School.School_management.Dto.AboutSchoolDto;
import com.School.School_management.Service.AboutSchoolService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/about-schools")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class AboutSchoolController {
    private final AboutSchoolService service;

    public AboutSchoolController(AboutSchoolService service) {
        this.service = service;
    }

    @GetMapping
    public List<AboutSchoolDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    public Page<AboutSchoolDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.listPaginated(headOfficeId, schoolId, search, page, size);
    }

    @PostMapping
    public AboutSchoolDto create(@RequestBody AboutSchoolDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public AboutSchoolDto update(@PathVariable Long id, @RequestBody AboutSchoolDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "About School deleted successfully";
    }
}
