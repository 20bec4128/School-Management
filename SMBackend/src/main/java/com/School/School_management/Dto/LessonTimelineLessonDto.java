package com.School.School_management.Dto;

import java.time.LocalDate;

public class LessonTimelineLessonDto {
    private Long lessonId;
    private String lessonName;
    private LocalDate startDate;
    private LocalDate endDate;

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public String getLessonName() { return lessonName; }
    public void setLessonName(String lessonName) { this.lessonName = lessonName; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}

