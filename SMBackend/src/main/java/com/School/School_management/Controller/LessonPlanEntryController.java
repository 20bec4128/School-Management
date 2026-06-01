package com.School.School_management.Controller;

import com.School.School_management.Dto.LessonPlanEntryDto;
import com.School.School_management.Service.LessonPlanEntryService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;
import com.School.School_management.auth.SchoolGuard;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lesson-plan-entries")
public class LessonPlanEntryController {

    private final LessonPlanEntryService service;
    private final SchoolGuard schoolGuard;

    public LessonPlanEntryController(LessonPlanEntryService service, SchoolGuard schoolGuard) {
        this.service = service;
        this.schoolGuard = schoolGuard;
    }

    @GetMapping
    @RequirePagePermission(slug = "lesson-plan", action = "view")
    public List<LessonPlanEntryDto> getAll(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long lessonId,
            @RequestParam(required = false) Long topicId
    ) {
        schoolId = schoolGuard.schoolIdForRead(CurrentUserHolder.get(), schoolId);
        return service.getAll(schoolId, academicYear, classId, subjectId, lessonId, topicId);
    }

    @PostMapping
    @RequirePagePermission(slug = "lesson-plan", action = "add")
    public LessonPlanEntryDto create(@RequestBody LessonPlanEntryDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "lesson-plan", action = "edit")
    public LessonPlanEntryDto update(@PathVariable Long id, @RequestBody LessonPlanEntryDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "lesson-plan", action = "delete")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
