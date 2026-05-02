package com.School.School_management.Dto;

import java.time.LocalDate;

public class AssignmentRequestDto {

    private Long schoolId;
    private Long classId;
    private Long sectionId;
    private Long subjectId;

    private String title;
    private LocalDate assignmentDate;
    private LocalDate submissionDate;

    private Boolean smsNotification;
    private Boolean emailNotification;

    private String note;
    private String status;

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

    public Boolean getSmsNotification() { return smsNotification; }
    public void setSmsNotification(Boolean smsNotification) { this.smsNotification = smsNotification; }

    public Boolean getEmailNotification() { return emailNotification; }
    public void setEmailNotification(Boolean emailNotification) { this.emailNotification = emailNotification; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}