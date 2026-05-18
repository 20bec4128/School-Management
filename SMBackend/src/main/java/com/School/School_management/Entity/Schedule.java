package com.School.School_management.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "schedule")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "exam_term", nullable = false)
    private String examTerm;

    @Column(name = "class_name", nullable = false)
    private String className;

    @Column(name = "subject_name", nullable = false)
    private String subjectName;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "room_no")
    private String roomNo;

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
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
    public String getExamTerm() { return examTerm; }
    public void setExamTerm(String examTerm) { this.examTerm = examTerm; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public String getRoomNo() { return roomNo; }
    public void setRoomNo(String roomNo) { this.roomNo = roomNo; }
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
        private Long schoolId;
        private String examTerm;
        private String className;
        private String subjectName;
        private LocalDate examDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private String roomNo;
        private String note;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder schoolId(Long schoolId) { this.schoolId = schoolId; return this; }
        public Builder examTerm(String examTerm) { this.examTerm = examTerm; return this; }
        public Builder className(String className) { this.className = className; return this; }
        public Builder subjectName(String subjectName) { this.subjectName = subjectName; return this; }
        public Builder examDate(LocalDate examDate) { this.examDate = examDate; return this; }
        public Builder startTime(LocalTime startTime) { this.startTime = startTime; return this; }
        public Builder endTime(LocalTime endTime) { this.endTime = endTime; return this; }
        public Builder roomNo(String roomNo) { this.roomNo = roomNo; return this; }
        public Builder note(String note) { this.note = note; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Schedule build() {
            Schedule schedule = new Schedule();
            schedule.setId(id);
            schedule.setSchoolId(schoolId);
            schedule.setExamTerm(examTerm);
            schedule.setClassName(className);
            schedule.setSubjectName(subjectName);
            schedule.setExamDate(examDate);
            schedule.setStartTime(startTime);
            schedule.setEndTime(endTime);
            schedule.setRoomNo(roomNo);
            schedule.setNote(note);
            schedule.setCreatedAt(createdAt);
            schedule.setUpdatedAt(updatedAt);
            return schedule;
        }
    }
}
