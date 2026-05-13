package com.School.School_management.Controller;

import com.School.School_management.Dto.EmployeeDto;
import com.School.School_management.Service.EmployeeService;
import com.School.School_management.auth.RequirePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/employees")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class EmployeeController {

    private final EmployeeService employeeService;
    private final ObjectMapper objectMapper;

    public EmployeeController(EmployeeService employeeService, ObjectMapper objectMapper) {
        this.employeeService = employeeService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<EmployeeDto> list(@RequestParam(required = false) Long schoolId) {
        return employeeService.list(schoolId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EmployeeDto create(
            @RequestPart("data") String data,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "resume", required = false) MultipartFile resume
    ) throws Exception {
        EmployeeDto dto = objectMapper.readValue(data, EmployeeDto.class);
        return employeeService.create(dto, photo, resume);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EmployeeDto update(
            @PathVariable Long id,
            @RequestPart("data") String data,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "resume", required = false) MultipartFile resume
    ) throws Exception {
        EmployeeDto dto = objectMapper.readValue(data, EmployeeDto.class);
        return employeeService.update(id, dto, photo, resume);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        employeeService.delete(id);
        return "Employee deleted successfully";
    }
}
