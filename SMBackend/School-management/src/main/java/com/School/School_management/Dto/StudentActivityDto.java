// com/School/School_management/Dto/StudentActivityDto.java
package com.School.School_management.Dto;

import java.time.LocalDate;

public class StudentActivityDto {

    // Request DTO for Create/Update
    public static class Request {
        private Long schoolId;
        private Long studentId;
        private String className;
        private String section;
        private LocalDate date;
        private String activity;
        private String description;

        // Getters and Setters
        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        
        public String getSection() { return section; }
        public void setSection(String section) { this.section = section; }
        
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        
        public String getActivity() { return activity; }
        public void setActivity(String activity) { this.activity = activity; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    // Response DTO
    public static class Response {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private Long studentId;
        private String studentName;
        private String className;
        private String section;
        private LocalDate date;
        private String activity;
        private String description;

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public Long getSchoolId() { return schoolId; }
        public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
        
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        
        public String getSection() { return section; }
        public void setSection(String section) { this.section = section; }
        
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        
        public String getActivity() { return activity; }
        public void setActivity(String activity) { this.activity = activity; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}