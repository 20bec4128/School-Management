package com.School.School_management.Dto;

import com.School.School_management.Entity.LessonProgressStatus;

public class UpdateStatusResponseDto {
    private Long lessonId;
    private LessonProgressStatus lessonStatus;
    private Long topicId;
    private LessonProgressStatus topicStatus;

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public LessonProgressStatus getLessonStatus() { return lessonStatus; }
    public void setLessonStatus(LessonProgressStatus lessonStatus) { this.lessonStatus = lessonStatus; }

    public Long getTopicId() { return topicId; }
    public void setTopicId(Long topicId) { this.topicId = topicId; }

    public LessonProgressStatus getTopicStatus() { return topicStatus; }
    public void setTopicStatus(LessonProgressStatus topicStatus) { this.topicStatus = topicStatus; }
}

