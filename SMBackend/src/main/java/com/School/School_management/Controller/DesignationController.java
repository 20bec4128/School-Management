package com.School.School_management.Controller;

import com.School.School_management.Dto.DesignationDto;
import com.School.School_management.Service.DesignationService;
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
@RequestMapping("/api/designations")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class DesignationController {

    private final DesignationService designationService;

    public DesignationController(DesignationService designationService) {
        this.designationService = designationService;
    }

    @GetMapping
    public List<DesignationDto> list(@RequestParam(required = false) Long schoolId) {
        return designationService.list(schoolId);
    }

    @PostMapping
    public DesignationDto create(@RequestBody DesignationDto dto) {
        return designationService.create(dto);
    }

    @PutMapping("/{id}")
    public DesignationDto update(@PathVariable Long id, @RequestBody DesignationDto dto) {
        return designationService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        designationService.delete(id);
        return "Designation deleted successfully";
    }
}

