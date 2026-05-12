package com.School.School_management.Entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long schoolId;
    private Long classId;
    private Long sectionId;
    private Long subjectId;

    private String title;

    private LocalDate assignmentDate;
    private LocalDate submissionDate;

    private String assignmentFile;

    private Boolean smsNotification;
    private Boolean emailNotification;

    @Column(length = 1000)
    private String note;

    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Assignment() {}

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        status = status == null ? "Pending" : status;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public Long getSectionId() { return sectionId; }
    public void setSectionId(Long sectionId) { this.sectionId = sectionId; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDate getAssignmentDate() { return assignmentDate; }
    public void setAssignmentDate(LocalDate assignmentDate) { this.assignmentDate = assignmentDate; }

    public LocalDate getSubmissionDate() { return submissionDate; }
    public void setSubmissionDate(LocalDate submissionDate) { this.submissionDate = submissionDate; }

    public String getAssignmentFile() { return assignmentFile; }
    public void setAssignmentFile(String assignmentFile) { this.assignmentFile = assignmentFile; }

    public Boolean getSmsNotification() { return smsNotification; }
    public void setSmsNotification(Boolean smsNotification) { this.smsNotification = smsNotification; }

    public Boolean getEmailNotification() { return emailNotification; }
    public void setEmailNotification(Boolean emailNotification) { this.emailNotification = emailNotification; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}