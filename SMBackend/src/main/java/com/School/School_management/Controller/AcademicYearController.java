package com.School.School_management.Controller;

import com.School.School_management.Dto.AcademicYearDto;
import com.School.School_management.Service.AcademicYearService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
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
@RequestMapping("/api/academic-years")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class AcademicYearController {

    private final AcademicYearService academicYearService;

    public AcademicYearController(AcademicYearService academicYearService) {
        this.academicYearService = academicYearService;
    }

    @GetMapping
    public List<AcademicYearDto> list(@RequestParam(required = false) Long schoolId) {
        return academicYearService.list(schoolId);
    }

    @PostMapping
    public AcademicYearDto create(@RequestBody AcademicYearDto dto) {
        return academicYearService.create(dto);
    }

    @PutMapping("/{id}")
    public AcademicYearDto update(@PathVariable Long id, @RequestBody AcademicYearDto dto) {
        return academicYearService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        academicYearService.delete(id);
        return "Academic year deleted successfully";
    }
}
