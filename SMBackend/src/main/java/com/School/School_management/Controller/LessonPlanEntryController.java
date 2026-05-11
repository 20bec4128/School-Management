package com.School.School_management.Controller;

import com.School.School_management.Dto.LessonPlanEntryDto;
import com.School.School_management.Service.LessonPlanEntryService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;
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

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "LESSON_PLAN_VIEW_OWN", "LESSON_PLAN_VIEW_CHILD", "*"})
    @GetMapping
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

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "*"})
    @PostMapping
    public LessonPlanEntryDto create(@RequestBody LessonPlanEntryDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return service.create(dto);
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "*"})
    @PutMapping("/{id}")
    public LessonPlanEntryDto update(@PathVariable Long id, @RequestBody LessonPlanEntryDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return service.update(id, dto);
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "*"})
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}

