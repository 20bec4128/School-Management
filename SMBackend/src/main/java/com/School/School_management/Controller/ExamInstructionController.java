package com.School.School_management.Controller;

import com.School.School_management.Dto.ExamInstructionDto;
import com.School.School_management.Service.ExamInstructionService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exam-instructions")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class ExamInstructionController {

    private final ExamInstructionService service;

    public ExamInstructionController(ExamInstructionService service) {
        this.service = service;
    }

    @GetMapping
    public List<ExamInstructionDto> list(@RequestParam(required = false) Long schoolId) {
        return service.list(schoolId);
    }

    @GetMapping("/page")
    public Page<ExamInstructionDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(schoolId, status, page, size, search);
    }

    @PostMapping
    public ExamInstructionDto create(@RequestBody ExamInstructionDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ExamInstructionDto update(@PathVariable Long id, @RequestBody ExamInstructionDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Exam instruction deleted successfully";
    }
}
