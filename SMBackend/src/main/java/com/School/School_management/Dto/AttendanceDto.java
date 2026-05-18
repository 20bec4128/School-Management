package com.School.School_management.Dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getHeadOfficeId() { return headOfficeId; }
    public void setHeadOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; }
    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
    public String getExamTerm() { return examTerm; }
    public void setExamTerm(String examTerm) { this.examTerm = examTerm; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getRollNo() { return rollNo; }
    public void setRollNo(String rollNo) { this.rollNo = rollNo; }
    public String getPhotoPath() { return photoPath; }
    public void setPhotoPath(String photoPath) { this.photoPath = photoPath; }
    public String getAttendAll() { return attendAll; }
    public void setAttendAll(String attendAll) { this.attendAll = attendAll; }
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
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

        public Builder id(Long id) { this.id = id; return this; }
        public Builder headOfficeId(Long headOfficeId) { this.headOfficeId = headOfficeId; return this; }
        public Builder schoolId(Long schoolId) { this.schoolId = schoolId; return this; }
        public Builder examTerm(String examTerm) { this.examTerm = examTerm; return this; }
        public Builder className(String className) { this.className = className; return this; }
        public Builder sectionName(String sectionName) { this.sectionName = sectionName; return this; }
        public Builder subjectName(String subjectName) { this.subjectName = subjectName; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder rollNo(String rollNo) { this.rollNo = rollNo; return this; }
        public Builder photoPath(String photoPath) { this.photoPath = photoPath; return this; }
        public Builder attendAll(String attendAll) { this.attendAll = attendAll; return this; }
        public Builder attendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; return this; }
        public Builder note(String note) { this.note = note; return this; }

        public AttendanceDto build() {
            AttendanceDto dto = new AttendanceDto();
            dto.setId(id);
            dto.setHeadOfficeId(headOfficeId);
            dto.setSchoolId(schoolId);
            dto.setExamTerm(examTerm);
            dto.setClassName(className);
            dto.setSectionName(sectionName);
            dto.setSubjectName(subjectName);
            dto.setName(name);
            dto.setPhone(phone);
            dto.setRollNo(rollNo);
            dto.setPhotoPath(photoPath);
            dto.setAttendAll(attendAll);
            dto.setAttendanceDate(attendanceDate);
            dto.setNote(note);
            return dto;
        }
    }
}
