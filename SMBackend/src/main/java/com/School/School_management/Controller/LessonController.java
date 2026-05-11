package com.School.School_management.Controller;

import com.School.School_management.Dto.LessonDto;
import com.School.School_management.Service.LessonService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;
import com.School.School_management.auth.SchoolGuard;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;
    private final SchoolGuard schoolGuard;

    public LessonController(LessonService lessonService, SchoolGuard schoolGuard) {
        this.lessonService = lessonService;
        this.schoolGuard = schoolGuard;
    }

    @RequirePermission({"LESSON_MANAGE", "LESSON_MANAGE_ASSIGNED", "LESSON_VIEW_OWN", "LESSON_VIEW_CHILD", "*"})
    @GetMapping
    public List<LessonDto> getAll(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long subjectId
    ) {
        schoolId = schoolGuard.schoolIdForRead(CurrentUserHolder.get(), schoolId);
        return lessonService.getAll(schoolId, academicYear, classId, subjectId);
    }

    @RequirePermission({"LESSON_MANAGE", "LESSON_MANAGE_ASSIGNED", "*"})
    @PostMapping
    public LessonDto create(@RequestBody LessonDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return lessonService.create(dto);
    }

    @RequirePermission({"LESSON_MANAGE", "LESSON_MANAGE_ASSIGNED", "*"})
    @PutMapping("/{id}")
    public LessonDto update(@PathVariable Long id, @RequestBody LessonDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return lessonService.update(id, dto);
    }

    @RequirePermission({"LESSON_MANAGE", "LESSON_MANAGE_ASSIGNED", "*"})
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        lessonService.delete(id);
    }
}

