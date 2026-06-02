package com.School.School_management.Controller;

import com.School.School_management.Dto.OnlineExamDto;
import com.School.School_management.Service.OnlineExamService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/online-exams")
@RequirePagePermission(slug = "online-exam", action = "view")
public class OnlineExamController {

    private final OnlineExamService service;

    public OnlineExamController(OnlineExamService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "online-exam", action = "view")
    public List<OnlineExamDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "online-exam", action = "view")
    public Page<OnlineExamDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String isPublish,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(headOfficeId, schoolId, classId, subjectId, isPublish, page, size, search);
    }

    @PostMapping
    @RequirePagePermission(slug = "online-exam", action = "add")
    public OnlineExamDto create(@RequestBody OnlineExamDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "online-exam", action = "edit")
    public OnlineExamDto update(@PathVariable Long id, @RequestBody OnlineExamDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "online-exam", action = "delete")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Online exam deleted successfully";
    }
}
