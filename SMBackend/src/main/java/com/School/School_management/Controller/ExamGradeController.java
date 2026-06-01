package com.School.School_management.Controller;

import com.School.School_management.Dto.ExamGradeDto;
import com.School.School_management.Service.ExamGradeService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exam-grades")
public class ExamGradeController {

    private final ExamGradeService examGradeService;

    public ExamGradeController(ExamGradeService examGradeService) {
        this.examGradeService = examGradeService;
    }

    @GetMapping
    @RequirePagePermission(slug = "exam-grade", action = "view")
    public List<ExamGradeDto> list(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId
    ) {
        return examGradeService.list(headOfficeId, schoolId);
    }

    @GetMapping("/page")
    @RequirePagePermission(slug = "exam-grade", action = "view")
    public Page<ExamGradeDto> listPaginated(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return examGradeService.listPaginated(headOfficeId, schoolId, page, size, search);
    }

    @PostMapping
    @RequirePagePermission(slug = "exam-grade", action = "add")
    public ExamGradeDto create(@RequestBody ExamGradeDto dto) {
        return examGradeService.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "exam-grade", action = "edit")
    public ExamGradeDto update(@PathVariable Long id, @RequestBody ExamGradeDto dto) {
        return examGradeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "exam-grade", action = "delete")
    public String delete(@PathVariable Long id) {
        examGradeService.delete(id);
        return "Exam Grade deleted successfully";
    }
}
