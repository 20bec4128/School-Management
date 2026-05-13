package com.School.School_management.Controller;

import com.School.School_management.Dto.SubjectRequestDto;
import com.School.School_management.Dto.SubjectResponseDto;
import com.School.School_management.Service.SubjectService;
import com.School.School_management.auth.RequirePermission;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @RequirePermission({"SUBJECT_MANAGE", "SUBJECT_MANAGE_ASSIGNED", "SUBJECT_VIEW_ASSIGNED", "SUBJECT_VIEW_OWN", "SUBJECT_VIEW_CHILD", "*"})
    @GetMapping
    public List<SubjectResponseDto> getAllSubjects(@RequestParam(required = false) Long schoolId) {
        return subjectService.getAllSubjects(schoolId);
    }

    @RequirePermission({"SUBJECT_MANAGE", "SUBJECT_MANAGE_ASSIGNED", "SUBJECT_VIEW_ASSIGNED", "SUBJECT_VIEW_OWN", "SUBJECT_VIEW_CHILD", "*"})
    @GetMapping("/{id}")
    public SubjectResponseDto getSubjectById(@PathVariable Long id) {
        return subjectService.getSubjectById(id);
    }

    @RequirePermission({"SUBJECT_MANAGE", "SUBJECT_MANAGE_ASSIGNED", "*"})
    @PostMapping
    public SubjectResponseDto createSubject(@RequestBody SubjectRequestDto requestDto) {
        return subjectService.createSubject(requestDto);
    }

    @RequirePermission({"SUBJECT_MANAGE", "SUBJECT_MANAGE_ASSIGNED", "*"})
    @PutMapping("/{id}")
    public SubjectResponseDto updateSubject(
            @PathVariable Long id,
            @RequestBody SubjectRequestDto requestDto
    ) {
        return subjectService.updateSubject(id, requestDto);
    }

    @RequirePermission({"SUBJECT_MANAGE", "SUBJECT_MANAGE_ASSIGNED", "*"})
    @DeleteMapping("/{id}")
    public String deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return "Subject deleted successfully";
    }
}
