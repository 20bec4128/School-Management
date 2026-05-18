package com.School.School_management.Controller;

import com.School.School_management.Dto.ExamGradeDto;
import com.School.School_management.Service.ExamGradeService;
import com.School.School_management.auth.RequirePermission;
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
@RequirePermission({"SCHOOL_MANAGE", "HEAD_OFFICE_SCHOOL_MANAGE", "*"})
public class ExamGradeController {

    private final ExamGradeService examGradeService;

    public ExamGradeController(ExamGradeService examGradeService) {
        this.examGradeService = examGradeService;
    }

    @GetMapping
    public List<ExamGradeDto> list(@RequestParam(required = false) Long schoolId) {
        return examGradeService.list(schoolId);
    }

    @GetMapping("/page")
    public Page<ExamGradeDto> listPaginated(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return examGradeService.listPaginated(schoolId, page, size, search);
    }

    @PostMapping
    public ExamGradeDto create(@RequestBody ExamGradeDto dto) {
        return examGradeService.create(dto);
    }

    @PutMapping("/{id}")
    public ExamGradeDto update(@PathVariable Long id, @RequestBody ExamGradeDto dto) {
        return examGradeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        examGradeService.delete(id);
        return "Exam Grade deleted successfully";
    }
}
