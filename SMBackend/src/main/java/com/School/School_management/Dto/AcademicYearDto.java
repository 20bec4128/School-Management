package com.School.School_management.Dto;

import java.time.LocalDate;

public class AcademicYearDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private String academicYear;
    private LocalDate sessionStart;
    private LocalDate sessionEnd;
    private Boolean isRunning;
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

    public String getSchoolName() {
        return schoolName;
    }

    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public LocalDate getSessionStart() {
        return sessionStart;
    }

    public void setSessionStart(LocalDate sessionStart) {
        this.sessionStart = sessionStart;
    }

    public LocalDate getSessionEnd() {
        return sessionEnd;
    }

    public void setSessionEnd(LocalDate sessionEnd) {
        this.sessionEnd = sessionEnd;
    }

    public Boolean getIsRunning() {
        return isRunning;
    }

    public void setIsRunning(Boolean isRunning) {
        this.isRunning = isRunning;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
