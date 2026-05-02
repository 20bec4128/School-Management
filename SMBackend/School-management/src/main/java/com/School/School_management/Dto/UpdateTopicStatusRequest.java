package com.School.School_management.Dto;

import com.School.School_management.Entity.LessonProgressStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateTopicStatusRequest {

    @NotNull
    private Long topicId;

    @NotNull
    private LessonProgressStatus status;

    public Long getTopicId() { return topicId; }
    public void setTopicId(Long topicId) { this.topicId = topicId; }

    public LessonProgressStatus getStatus() { return status; }
    public void setStatus(LessonProgressStatus status) { this.status = status; }
}

