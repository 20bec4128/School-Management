package com.School.School_management.Dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDto {
    private Long id;
    private Long headOfficeId;
    private Long schoolId;
    private String examTerm;
    private String className;
    private String sectionName;
    private String subjectName;
    private String name;
    private String phone;
    private String rollNo;
    private String photoPath;
    private String attendAll;
    private LocalDate attendanceDate;
    private String note;
}