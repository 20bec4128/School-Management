package com.School.School_management.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "head_office_id")
    private Long headOfficeId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "exam_term", nullable = false)
    private String examTerm;

    @Column(name = "class_name", nullable = false)
    private String className;

    @Column(name = "section_name")
    private String sectionName;

    @Column(name = "subject_name", nullable = false)
    private String subjectName;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "phone")
    private String phone;

    @Column(name = "roll_no")
    private String rollNo;

    @Column(name = "photo_path")
    private String photoPath;

    @Column(name = "attend_all", nullable = false)
    private String attendAll;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.attendanceDate == null) {
            this.attendanceDate = LocalDate.now();
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

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
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

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
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Attendance build() {
            Attendance entity = new Attendance();
            entity.setId(id);
            entity.setHeadOfficeId(headOfficeId);
            entity.setSchoolId(schoolId);
            entity.setExamTerm(examTerm);
            entity.setClassName(className);
            entity.setSectionName(sectionName);
            entity.setSubjectName(subjectName);
            entity.setName(name);
            entity.setPhone(phone);
            entity.setRollNo(rollNo);
            entity.setPhotoPath(photoPath);
            entity.setAttendAll(attendAll);
            entity.setAttendanceDate(attendanceDate);
            entity.setNote(note);
            entity.setCreatedAt(createdAt);
            entity.setUpdatedAt(updatedAt);
            return entity;
        }
    }
}
