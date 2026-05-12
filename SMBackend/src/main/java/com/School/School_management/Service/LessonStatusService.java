package com.School.School_management.Service;

import com.School.School_management.Dto.LessonStatusPageDataDto;
import com.School.School_management.Dto.UpdateLessonStatusRequest;
import com.School.School_management.Dto.UpdateStatusResponseDto;
import com.School.School_management.Dto.UpdateTopicStatusRequest;

public interface LessonStatusService {
    LessonStatusPageDataDto pageData(Long schoolId, Long classId, Long subjectId, String academicYear);
    UpdateStatusResponseDto updateTopic(UpdateTopicStatusRequest request);
    UpdateStatusResponseDto updateLesson(UpdateLessonStatusRequest request);
}

