package com.School.School_management.Dto;

import java.time.LocalDateTime;

public class IncomeHeadDto {
    private Long id;
    private Long schoolId;
    private String schoolName;
    private String incomeHead;
    private String note;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public String getIncomeHead() { return incomeHead; }
    public void setIncomeHead(String incomeHead) { this.incomeHead = incomeHead; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
