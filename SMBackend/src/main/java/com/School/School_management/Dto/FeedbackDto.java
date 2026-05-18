package com.School.School_management.Dto;

import java.time.LocalDate;

public class FeedbackDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private String feedback;
    private boolean isPublish;
    private LocalDate date;

    public FeedbackDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public boolean getIsPublish() { return isPublish; }
    public void setIsPublish(boolean isPublish) { this.isPublish = isPublish; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
