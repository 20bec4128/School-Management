package com.School.School_management.Service;

import com.School.School_management.Dto.LessonPlanEntryDto;
import java.util.List;

public interface LessonPlanEntryService {

    List<LessonPlanEntryDto> getAll(Long schoolId, String academicYear, Long classId, Long subjectId, Long lessonId, Long topicId);

    LessonPlanEntryDto create(LessonPlanEntryDto dto);

    LessonPlanEntryDto update(Long id, LessonPlanEntryDto dto);

    void delete(Long id);
}

