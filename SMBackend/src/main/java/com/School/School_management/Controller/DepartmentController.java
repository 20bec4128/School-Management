package com.School.School_management.Controller;

import com.School.School_management.Dto.DepartmentDto;
import com.School.School_management.Service.DepartmentService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departments")
@RequirePagePermission(slug = "teacher-department", action = "view")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping("/all")
    @RequirePagePermission(slug = "teacher-department", action = "view")
    public List<DepartmentDto> getAll() {
        return departmentService.getAll();
    }

    @GetMapping
    @RequirePagePermission(slug = "teacher-department", action = "view")
    public Page<DepartmentDto> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return departmentService.getAll(page, size);
    }

    @PostMapping
    @RequirePagePermission(slug = "teacher-department", action = "add")
    public DepartmentDto create(@RequestBody DepartmentDto dto) {
        return departmentService.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "teacher-department", action = "edit")
    public DepartmentDto update(@PathVariable Long id, @RequestBody DepartmentDto dto) {
        return departmentService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "teacher-department", action = "delete")
    public String delete(@PathVariable Long id) {
        departmentService.delete(id);
        return "Department deleted successfully";
    }
}
