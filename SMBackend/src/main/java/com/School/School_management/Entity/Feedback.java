package com.School.School_management.Entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "feedbacks")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "is_publish", nullable = false)
    private boolean isPublish;

    @Column(nullable = false)
    private LocalDate date;

    public Feedback() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public boolean getIsPublish() { return isPublish; }
    public void setIsPublish(boolean isPublish) { this.isPublish = isPublish; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
