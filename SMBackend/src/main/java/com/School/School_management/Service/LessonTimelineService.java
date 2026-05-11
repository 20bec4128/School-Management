package com.School.School_management.Service;

import com.School.School_management.Dto.LessonPlanRowDto;
import com.School.School_management.Dto.LessonTimelineLessonDto;
import com.School.School_management.Dto.LessonTimelineTopicDto;
import com.School.School_management.Dto.UpdateTimelineRequestDto;
import java.util.List;

public interface LessonTimelineService {
    List<LessonTimelineLessonDto> listLessons(Long schoolId, String academicYear, Long classId, Long subjectId);
    List<LessonTimelineTopicDto> listTopics(Long schoolId, String academicYear, Long classId, Long subjectId, Long lessonId);
    LessonTimelineLessonDto updateLesson(Long lessonId, UpdateTimelineRequestDto request);
    LessonTimelineTopicDto updateTopic(Long topicId, UpdateTimelineRequestDto request);
    List<LessonPlanRowDto> planView(Long schoolId, String academicYear, Long classId, Long subjectId);
}

