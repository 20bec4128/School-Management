package com.School.School_management.Service;

import com.School.School_management.Dto.TopicDto;
import java.util.List;

public interface TopicService {

    List<TopicDto> getAll(Long schoolId, String academicYear, Long classId, Long subjectId, Long lessonId);

    TopicDto create(TopicDto dto);

    TopicDto update(Long id, TopicDto dto);

    void delete(Long id);
}

