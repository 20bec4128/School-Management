package com.School.School_management.Controller;

import com.School.School_management.Dto.TopicDto;
import com.School.School_management.Service.TopicService;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;
import com.School.School_management.auth.SchoolGuard;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/topics")
@RequirePagePermission(slug = "topic", action = "view")
public class TopicController {

    private final TopicService topicService;
    private final SchoolGuard schoolGuard;

    public TopicController(TopicService topicService, SchoolGuard schoolGuard) {
        this.topicService = topicService;
        this.schoolGuard = schoolGuard;
    }

    @GetMapping
    @RequirePagePermission(slug = "topic", action = "view")
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

    @PostMapping
    @RequirePagePermission(slug = "topic", action = "add")
    public TopicDto create(@RequestBody TopicDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return topicService.create(dto);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(slug = "topic", action = "edit")
    public TopicDto update(@PathVariable Long id, @RequestBody TopicDto dto) {
        dto.setSchoolId(schoolGuard.schoolIdForWrite(CurrentUserHolder.get(), dto.getSchoolId()));
        return topicService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(slug = "topic", action = "delete")
    public void delete(@PathVariable Long id) {
        topicService.delete(id);
    }
}
