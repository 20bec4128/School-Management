package com.School.School_management.Controller;

import com.School.School_management.Dto.TopicDto;
import com.School.School_management.Service.TopicService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePermission;
import com.School.School_management.auth.SchoolGuard;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/topics")
public class TopicController {

    private final TopicService topicService;
    private final SchoolGuard schoolGuard;

    public TopicController(TopicService topicService, SchoolGuard schoolGuard) {
        this.topicService = topicService;
        this.schoolGuard = schoolGuard;
    }

    @RequirePermission({"TOPIC_MANAGE", "TOPIC_MANAGE_ASSIGNED", "TOPIC_VIEW_OWN", "TOPIC_VIEW_CHILD", "*"})
    @GetMapping
    public List<TopicDto> getAll(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long lessonId
    ) {
        schoolId = schoolGuard.schoolIdForRead(CurrentUserHolder.get(), schoolId);
        return topicService.getAll(schoolId, academicYear, classId, subjectId, lessonId);
    }

    @RequirePermission({"TOPIC_MANAGE", "TOPIC_MANAGE_ASSIGNED", "*"})
    @PostMapping
    public TopicDto create(@RequestBody TopicDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return topicService.create(dto);
    }

    @RequirePermission({"TOPIC_MANAGE", "TOPIC_MANAGE_ASSIGNED", "*"})
    @PutMapping("/{id}")
    public TopicDto update(@PathVariable Long id, @RequestBody TopicDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return topicService.update(id, dto);
    }

    @RequirePermission({"TOPIC_MANAGE", "TOPIC_MANAGE_ASSIGNED", "*"})
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        topicService.delete(id);
    }
}

