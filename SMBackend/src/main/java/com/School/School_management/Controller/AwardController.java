package com.School.School_management.Controller;

import com.School.School_management.Dto.AwardDto;
import com.School.School_management.Service.AwardService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/awards")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class AwardController {

    private final AwardService service;

    public AwardController(AwardService service) {
        this.service = service;
    }

    @GetMapping
    public List<AwardDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    public Page<AwardDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String gift,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.listPaginated(headOfficeId, schoolId, userType, title, gift, search, page, size);
    }

    @PostMapping
    public AwardDto create(@RequestBody AwardDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public AwardDto update(@PathVariable Long id, @RequestBody AwardDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Award deleted successfully";
    }
}
