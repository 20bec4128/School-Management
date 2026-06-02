package com.School.School_management.Controller;

import com.School.School_management.Dto.SubjectRequestDto;
import com.School.School_management.Dto.SubjectResponseDto;
import com.School.School_management.Service.SubjectService;
import com.School.School_management.auth.RequirePagePermission;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequirePagePermission(slug = "subject", action = "view")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    @RequirePagePermission(slug = "subject", action = "view")
    public List<SubjectResponseDto> getAllSubjects(@RequestParam(required = false) Long schoolId) {
        return subjectService.getAllSubjects(schoolId);
    }

    @GetMapping("/{id}")
    @RequirePagePermission(slug = "subject", action = "view")
    public SubjectResponseDto getSubjectById(@PathVariable Long id) {
        return subjectService.getSubjectById(id);
    }

    @PostMapping
    @RequirePagePermission(slug = "subject", action = "add")
    public SubjectResponseDto createSubject(@RequestBody SubjectRequestDto requestDto) {
        return subjectService.createSubject(requestDto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "subject", action = "edit")
    public SubjectResponseDto updateSubject(
            @PathVariable Long id,
            @RequestBody SubjectRequestDto requestDto
    ) {
        return subjectService.updateSubject(id, requestDto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "subject", action = "delete")
    public String deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return "Subject deleted successfully";
    }
}
