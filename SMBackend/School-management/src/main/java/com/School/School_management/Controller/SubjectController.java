package com.School.School_management.Controller;

import com.School.School_management.Dto.SubjectRequestDto;
import com.School.School_management.Dto.SubjectResponseDto;
import com.School.School_management.Service.SubjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public List<SubjectResponseDto> getAllSubjects() {
        return subjectService.getAllSubjects();
    }

    @GetMapping("/{id}")
    public SubjectResponseDto getSubjectById(@PathVariable Long id) {
        return subjectService.getSubjectById(id);
    }

    @PostMapping
    public SubjectResponseDto createSubject(@RequestBody SubjectRequestDto requestDto) {
        return subjectService.createSubject(requestDto);
    }

    @PutMapping("/{id}")
    public SubjectResponseDto updateSubject(
            @PathVariable Long id,
            @RequestBody SubjectRequestDto requestDto
    ) {
        return subjectService.updateSubject(id, requestDto);
    }

    @DeleteMapping("/{id}")
    public String deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return "Subject deleted successfully";
    }
}
