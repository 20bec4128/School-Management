package com.School.School_management.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;

@Entity
@Table(
    name = "academic_years",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_academic_year_school_year", columnNames = {"school_id", "academic_year"})
    }
)
public class AcademicYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "academic_year", nullable = false, length = 50)
    private String academicYear;

    @Column(name = "session_start", nullable = false)
    private LocalDate sessionStart;

    @Column(name = "session_end", nullable = false)
    private LocalDate sessionEnd;

    @Column(name = "is_running", nullable = false)
    private Boolean isRunning = false;

    @Column(columnDefinition = "TEXT")
    private String note;

    public AcademicYear() {
    }

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
