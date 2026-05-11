package com.School.School_management.Dto;

import com.School.School_management.Entity.LessonProgressStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateLessonStatusRequest {

    @NotNull
    private Long lessonId;

    @NotNull
    private LessonProgressStatus status;

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public LessonProgressStatus getStatus() { return status; }
    public void setStatus(LessonProgressStatus status) { this.status = status; }
}

