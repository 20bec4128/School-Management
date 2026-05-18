package com.School.School_management.Dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkSendEmailDto {
    private Long id;
    private Long headOfficeId;
    private Long schoolId;
    private String schoolName;
    private String examTerm;
    private String receiverType;
    private String studentMark;
    private String template;
    private String subject;
    private String emailBody;
    private LocalDate sendDate;
}