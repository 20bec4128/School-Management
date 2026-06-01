package com.School.School_management.Controller;

import com.School.School_management.Dto.LessonStatusPageDataDto;
import com.School.School_management.Dto.UpdateLessonStatusRequest;
import com.School.School_management.Dto.UpdateStatusResponseDto;
import com.School.School_management.Dto.UpdateTopicStatusRequest;
import com.School.School_management.Service.LessonStatusService;
import com.School.School_management.auth.RequirePagePermission;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lesson-status")
public class LessonStatusController {

    private final LessonStatusService service;

    public LessonStatusController(LessonStatusService service) {
        this.service = service;
    }

    @GetMapping("/page-data")
    @RequirePagePermission(slug = "lesson-status", action = "view")
    public LessonStatusPageDataDto pageData(
            @RequestParam Long schoolId,
            @RequestParam Long classId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String academicYear
    ) {
        return service.pageData(schoolId, classId, subjectId, academicYear);
    }

    @PutMapping("/update-topic")
    @RequirePagePermission(slug = "lesson-status", action = "edit")
    public UpdateStatusResponseDto updateTopic(@Valid @RequestBody UpdateTopicStatusRequest request) {
        return service.updateTopic(request);
    }

    @PutMapping("/update-lesson")
    @RequirePagePermission(slug = "lesson-status", action = "edit")
    public UpdateStatusResponseDto updateLesson(@Valid @RequestBody UpdateLessonStatusRequest request) {
        return service.updateLesson(request);
    }
}
