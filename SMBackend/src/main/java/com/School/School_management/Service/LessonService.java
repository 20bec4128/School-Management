package com.School.School_management.Service;

import com.School.School_management.Dto.LessonDto;
import java.util.List;

public interface LessonService {

    List<LessonDto> getAll(Long schoolId, String academicYear, Long classId, Long subjectId);

    LessonDto create(LessonDto dto);

    LessonDto update(Long id, LessonDto dto);

    void delete(Long id);
}

