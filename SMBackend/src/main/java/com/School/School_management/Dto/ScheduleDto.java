package com.School.School_management.Dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDto {
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(Long schoolId) {
        this.schoolId = schoolId;
    }

    public String getExamTerm() {
        return examTerm;
    }

    public void setExamTerm(String examTerm) {
        this.examTerm = examTerm;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public LocalDate getExamDate() {
        return examDate;
    }

    public void setExamDate(LocalDate examDate) {
        this.examDate = examDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getRoomNo() {
        return roomNo;
    }

    public void setRoomNo(String roomNo) {
        this.roomNo = roomNo;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

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

        public ScheduleDto build() {
            ScheduleDto dto = new ScheduleDto();
            dto.setId(id);
            dto.setSchoolId(schoolId);
            dto.setExamTerm(examTerm);
            dto.setClassName(className);
            dto.setSubjectName(subjectName);
            dto.setExamDate(examDate);
            dto.setStartTime(startTime);
            dto.setEndTime(endTime);
            dto.setRoomNo(roomNo);
            dto.setNote(note);
            return dto;
        }
    }
}
