package com.School.School_management.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_message")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_office_id")
    private Long headOfficeId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "school_name")
    private String schoolName;

    @Column(name = "class_name")
    private String className;

    @Column(name = "receiver_type", nullable = false)
    private String receiverType;

    @Column(name = "receiver", nullable = false)
    private String receiver;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "email_body", nullable = false, columnDefinition = "TEXT")
    private String emailBody;

    @Column(name = "send_date", nullable = false)
    private LocalDate sendDate;

    @Column(name = "category")
    private String category;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.sendDate == null) {
            this.sendDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getHeadOfficeId() { return headOfficeId; }
    public void setHeadOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; }
    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public String getReceiverType() { return receiverType; }
    public void setReceiverType(String receiverType) { this.receiverType = receiverType; }
    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getEmailBody() { return emailBody; }
    public void setEmailBody(String emailBody) { this.emailBody = emailBody; }
    public LocalDate getSendDate() { return sendDate; }
    public void setSendDate(LocalDate sendDate) { this.sendDate = sendDate; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long headOfficeId;
        private Long schoolId;
        private String schoolName;
        private String className;
        private String receiverType;
        private String receiver;
        private String subject;
        private String emailBody;
        private LocalDate sendDate;
        private String category;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder headOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; return this; }
        public Builder schoolId(Long schoolId) { this.schoolId = schoolId; return this; }
        public Builder schoolName(String schoolName) { this.schoolName = schoolName; return this; }
        public Builder className(String className) { this.className = className; return this; }
        public Builder receiverType(String receiverType) { this.receiverType = receiverType; return this; }
        public Builder receiver(String receiver) { this.receiver = receiver; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder emailBody(String emailBody) { this.emailBody = emailBody; return this; }
        public Builder sendDate(LocalDate sendDate) { this.sendDate = sendDate; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public EmailMessage build() {
            EmailMessage entity = new EmailMessage();
            entity.setId(id);
            entity.setHeadOfficeId(headOfficeId);
            entity.setSchoolId(schoolId);
            entity.setSchoolName(schoolName);
            entity.setClassName(className);
            entity.setReceiverType(receiverType);
            entity.setReceiver(receiver);
            entity.setSubject(subject);
            entity.setEmailBody(emailBody);
            entity.setSendDate(sendDate);
            entity.setCategory(category);
            entity.setCreatedAt(createdAt);
            entity.setUpdatedAt(updatedAt);
            return entity;
        }
    }
}
