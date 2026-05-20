package com.School.School_management.Dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AbsentEmailSettingDto {
    private Long id;
    private Long headOfficeId;
    private Long schoolId;
    private Boolean enabled;
    private String receiverType;
    private String subjectTemplate;
    private String emailBodyTemplate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getHeadOfficeId() { return headOfficeId; }
    public void setHeadOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; }
    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public String getReceiverType() { return receiverType; }
    public void setReceiverType(String receiverType) { this.receiverType = receiverType; }
    public String getSubjectTemplate() { return subjectTemplate; }
    public void setSubjectTemplate(String subjectTemplate) { this.subjectTemplate = subjectTemplate; }
    public String getEmailBodyTemplate() { return emailBodyTemplate; }
    public void setEmailBodyTemplate(String emailBodyTemplate) { this.emailBodyTemplate = emailBodyTemplate; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long headOfficeId;
        private Long schoolId;
        private Boolean enabled;
        private String receiverType;
        private String subjectTemplate;
        private String emailBodyTemplate;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder headOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; return this; }
        public Builder schoolId(Long schoolId) { this.schoolId = schoolId; return this; }
        public Builder enabled(Boolean enabled) { this.enabled = enabled; return this; }
        public Builder receiverType(String receiverType) { this.receiverType = receiverType; return this; }
        public Builder subjectTemplate(String subjectTemplate) { this.subjectTemplate = subjectTemplate; return this; }
        public Builder emailBodyTemplate(String emailBodyTemplate) { this.emailBodyTemplate = emailBodyTemplate; return this; }

        public AbsentEmailSettingDto build() {
            AbsentEmailSettingDto dto = new AbsentEmailSettingDto();
            dto.setId(id);
            dto.setHeadOfficeId(headOfficeId);
            dto.setSchoolId(schoolId);
            dto.setEnabled(enabled);
            dto.setReceiverType(receiverType);
            dto.setSubjectTemplate(subjectTemplate);
            dto.setEmailBodyTemplate(emailBodyTemplate);
            return dto;
        }
    }
}

