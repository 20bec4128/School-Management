package com.School.School_management.Dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkSendSmsDto {
    private Long id;
    private Long headOfficeId;
    private Long schoolId;
    private String schoolName;
    private String examTerm;
    private String receiverType;
    private String receiver;
    private String template;
    private String sms;
    private String gateway;
    private LocalDate sendDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
