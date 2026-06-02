package com.School.School_management.Controller;

import com.School.School_management.Dto.ExamInstructionDto;
import com.School.School_management.Service.ExamInstructionService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exam-instructions")
@RequirePagePermission(slug = "exam-instruction", action = "view")
public class ExamInstructionController {

    private final ExamInstructionService service;

    public ExamInstructionController(ExamInstructionService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePagePermission(slug = "exam-instruction", action = "view")
    public List<ExamInstructionDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return service.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "exam-instruction", action = "view")
    public Page<ExamInstructionDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return service.listPaginated(headOfficeId, schoolId, status, page, size, search);
    }

    @PostMapping
    @RequirePagePermission(slug = "exam-instruction", action = "add")
    public ExamInstructionDto create(@RequestBody ExamInstructionDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "exam-instruction", action = "edit")
    public ExamInstructionDto update(@PathVariable Long id, @RequestBody ExamInstructionDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "exam-instruction", action = "delete")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Exam instruction deleted successfully";
    }
}
