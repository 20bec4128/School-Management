package com.School.School_management.Dto;

import com.School.School_management.Entity.LessonProgressStatus;

public class LessonStatusTopicDto {
    private Long topicId;
    private String topicName;
    private LessonProgressStatus topicStatus;

    public Long getTopicId() { return topicId; }
    public void setTopicId(Long topicId) { this.topicId = topicId; }

    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }

    public LessonProgressStatus getTopicStatus() { return topicStatus; }
    public void setTopicStatus(LessonProgressStatus topicStatus) { this.topicStatus = topicStatus; }
}

