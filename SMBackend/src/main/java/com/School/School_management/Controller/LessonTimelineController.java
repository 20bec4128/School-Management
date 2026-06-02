package com.School.School_management.Controller;

import com.School.School_management.Dto.LessonPlanRowDto;
import com.School.School_management.Dto.LessonTimelineLessonDto;
import com.School.School_management.Dto.LessonTimelineTopicDto;
import com.School.School_management.Dto.UpdateTimelineRequestDto;
import com.School.School_management.Service.LessonTimelineService;
import com.School.School_management.auth.RequirePagePermission;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lesson-timeline")
@RequirePagePermission(slug = "lesson-plan", action = "view")
public class LessonTimelineController {

    private final LessonTimelineService service;

    public LessonTimelineController(LessonTimelineService service) {
        this.service = service;
    }

    @GetMapping("/lessons")
    @RequirePagePermission(slug = "lesson-plan", action = "view")
    public List<LessonTimelineLessonDto> lessons(
            @RequestParam Long schoolId,
            @RequestParam String academicYear,
            @RequestParam Long classId,
            @RequestParam(required = false) Long subjectId
    ) {
        return service.listLessons(schoolId, academicYear, classId, subjectId);
    }

    @GetMapping("/lessons/{lessonId}/topics")
    @RequirePagePermission(slug = "lesson-plan", action = "view")
    public List<LessonTimelineTopicDto> topics(
            @PathVariable Long lessonId,
            @RequestParam Long schoolId,
            @RequestParam String academicYear,
            @RequestParam Long classId,
            @RequestParam(required = false) Long subjectId
    ) {
        return service.listTopics(schoolId, academicYear, classId, subjectId, lessonId);
    }

    @PutMapping("/lessons/{lessonId}")
    @RequirePagePermission(slug = "lesson-plan", action = "edit")
    public LessonTimelineLessonDto updateLesson(@PathVariable Long lessonId, @RequestBody UpdateTimelineRequestDto request) {
        return service.updateLesson(lessonId, request);
    }

    @PutMapping("/topics/{topicId}")
    @RequirePagePermission(slug = "lesson-plan", action = "edit")
    public LessonTimelineTopicDto updateTopic(@PathVariable Long topicId, @RequestBody UpdateTimelineRequestDto request) {
        return service.updateTopic(topicId, request);
    }

    @GetMapping("/plan-view")
    @RequirePagePermission(slug = "lesson-plan", action = "view")
    public List<LessonPlanRowDto> planView(
            @RequestParam Long schoolId,
            @RequestParam String academicYear,
            @RequestParam Long classId,
            @RequestParam(required = false) Long subjectId
    ) {
        return service.planView(schoolId, academicYear, classId, subjectId);
    }
}
