package com.School.School_management.Controller;

import com.School.School_management.Dto.LessonStatusPageDataDto;
import com.School.School_management.Dto.UpdateLessonStatusRequest;
import com.School.School_management.Dto.UpdateStatusResponseDto;
import com.School.School_management.Dto.UpdateTopicStatusRequest;
import com.School.School_management.Service.LessonStatusService;
import com.School.School_management.auth.RequirePermission;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lesson-status")
public class LessonStatusController {

    private final LessonStatusService service;

    public LessonStatusController(LessonStatusService service) {
        this.service = service;
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "LESSON_PLAN_VIEW_OWN", "LESSON_PLAN_VIEW_CHILD", "*"})
    @GetMapping("/page-data")
    public LessonStatusPageDataDto pageData(
            @RequestParam Long schoolId,
            @RequestParam Long classId,
            @RequestParam Long subjectId,
            @RequestParam(required = false) String academicYear
    ) {
        return service.pageData(schoolId, classId, subjectId, academicYear);
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "*"})
    @PutMapping("/update-topic")
    public UpdateStatusResponseDto updateTopic(@Valid @RequestBody UpdateTopicStatusRequest request) {
        return service.updateTopic(request);
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "*"})
    @PutMapping("/update-lesson")
    public UpdateStatusResponseDto updateLesson(@Valid @RequestBody UpdateLessonStatusRequest request) {
        return service.updateLesson(request);
    }
}

