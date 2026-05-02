package com.School.School_management.Controller;

import com.School.School_management.Dto.LessonPlanRowDto;
import com.School.School_management.Dto.LessonTimelineLessonDto;
import com.School.School_management.Dto.LessonTimelineTopicDto;
import com.School.School_management.Dto.UpdateTimelineRequestDto;
import com.School.School_management.Service.LessonTimelineService;
import com.School.School_management.auth.RequirePermission;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lesson-timeline")
public class LessonTimelineController {

    private final LessonTimelineService service;

    public LessonTimelineController(LessonTimelineService service) {
        this.service = service;
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "LESSON_PLAN_VIEW_OWN", "LESSON_PLAN_VIEW_CHILD", "*"})
    @GetMapping("/lessons")
    public List<LessonTimelineLessonDto> lessons(
            @RequestParam Long schoolId,
            @RequestParam String academicYear,
            @RequestParam Long classId,
            @RequestParam Long subjectId
    ) {
        return service.listLessons(schoolId, academicYear, classId, subjectId);
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "LESSON_PLAN_VIEW_OWN", "LESSON_PLAN_VIEW_CHILD", "*"})
    @GetMapping("/lessons/{lessonId}/topics")
    public List<LessonTimelineTopicDto> topics(
            @PathVariable Long lessonId,
            @RequestParam Long schoolId,
            @RequestParam String academicYear,
            @RequestParam Long classId,
            @RequestParam Long subjectId
    ) {
        return service.listTopics(schoolId, academicYear, classId, subjectId, lessonId);
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "*"})
    @PutMapping("/lessons/{lessonId}")
    public LessonTimelineLessonDto updateLesson(@PathVariable Long lessonId, @RequestBody UpdateTimelineRequestDto request) {
        return service.updateLesson(lessonId, request);
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "*"})
    @PutMapping("/topics/{topicId}")
    public LessonTimelineTopicDto updateTopic(@PathVariable Long topicId, @RequestBody UpdateTimelineRequestDto request) {
        return service.updateTopic(topicId, request);
    }

    @RequirePermission({"LESSON_PLAN_MANAGE", "LESSON_PLAN_MANAGE_ASSIGNED", "LESSON_PLAN_VIEW_OWN", "LESSON_PLAN_VIEW_CHILD", "*"})
    @GetMapping("/plan-view")
    public List<LessonPlanRowDto> planView(
            @RequestParam Long schoolId,
            @RequestParam String academicYear,
            @RequestParam Long classId,
            @RequestParam Long subjectId
    ) {
        return service.planView(schoolId, academicYear, classId, subjectId);
    }
}

