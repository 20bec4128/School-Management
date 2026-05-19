package com.School.School_management.Dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailSettingDto {
    private Long id;
    private Long headOfficeId;
    private Long schoolId;
    private String schoolName;
    private String school;
    private String emailProtocol;
    private String emailType;
    private String charSet;
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpPassword;
    private String smtpSecurity;
    private Integer smtpTimeout;
    private String priority;
    private String fromName;
    private String fromEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
