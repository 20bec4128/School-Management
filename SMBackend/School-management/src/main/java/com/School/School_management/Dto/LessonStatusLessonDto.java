package com.School.School_management.Dto;

import com.School.School_management.Entity.LessonProgressStatus;
import java.util.ArrayList;
import java.util.List;

public class LessonStatusLessonDto {
    private Long lessonId;
    private String lessonName;
    private LessonProgressStatus lessonStatus;
    private List<LessonStatusTopicDto> topics = new ArrayList<>();

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public String getLessonName() { return lessonName; }
    public void setLessonName(String lessonName) { this.lessonName = lessonName; }

    public LessonProgressStatus getLessonStatus() { return lessonStatus; }
    public void setLessonStatus(LessonProgressStatus lessonStatus) { this.lessonStatus = lessonStatus; }

    public List<LessonStatusTopicDto> getTopics() { return topics; }
    public void setTopics(List<LessonStatusTopicDto> topics) { this.topics = topics; }
}

