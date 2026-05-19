package com.School.School_management.Dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailMessageDto {
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

        public EmailMessageDto build() {
            EmailMessageDto dto = new EmailMessageDto();
            dto.setId(id);
            dto.setHeadOfficeId(headOfficeId);
            dto.setSchoolId(schoolId);
            dto.setSchoolName(schoolName);
            dto.setClassName(className);
            dto.setReceiverType(receiverType);
            dto.setReceiver(receiver);
            dto.setSubject(subject);
            dto.setEmailBody(emailBody);
            dto.setSendDate(sendDate);
            return dto;
        }
    }
}
