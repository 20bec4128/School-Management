package com.School.School_management.Controller;

import com.School.School_management.Dto.ExamTermDto;
import com.School.School_management.Service.ExamTermService;
import com.School.School_management.auth.RequirePermission;
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
@RequestMapping("/api/exam-terms")
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class ExamTermController {

    private final ExamTermService examTermService;

    public ExamTermController(ExamTermService examTermService) {
        this.examTermService = examTermService;
    }

    @GetMapping
    public List<ExamTermDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return examTermService.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    public Page<ExamTermDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return examTermService.listPaginated(headOfficeId, schoolId, page, size, search);
    }

    @PostMapping
    public ExamTermDto create(@RequestBody ExamTermDto dto) {
        return examTermService.create(dto);
    }

    @PutMapping("/{id}")
    public ExamTermDto update(@PathVariable Long id, @RequestBody ExamTermDto dto) {
        return examTermService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        examTermService.delete(id);
        return "Exam Term deleted successfully";
    }
}
