package com.School.School_management.Dto;

import java.time.LocalDate;

public class LessonPlanRowDto {
    private Long lessonId;
    private String lessonName;
    private LocalDate lessonStartDate;
    private LocalDate lessonEndDate;

    private Long topicId;
    private String topicName;
    private LocalDate topicStartDate;
    private LocalDate topicEndDate;

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public String getLessonName() { return lessonName; }
    public void setLessonName(String lessonName) { this.lessonName = lessonName; }

    public LocalDate getLessonStartDate() { return lessonStartDate; }
    public void setLessonStartDate(LocalDate lessonStartDate) { this.lessonStartDate = lessonStartDate; }

    public LocalDate getLessonEndDate() { return lessonEndDate; }
    public void setLessonEndDate(LocalDate lessonEndDate) { this.lessonEndDate = lessonEndDate; }

    public Long getTopicId() { return topicId; }
    public void setTopicId(Long topicId) { this.topicId = topicId; }

    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }

    public LocalDate getTopicStartDate() { return topicStartDate; }
    public void setTopicStartDate(LocalDate topicStartDate) { this.topicStartDate = topicStartDate; }

    public LocalDate getTopicEndDate() { return topicEndDate; }
    public void setTopicEndDate(LocalDate topicEndDate) { this.topicEndDate = topicEndDate; }
}

